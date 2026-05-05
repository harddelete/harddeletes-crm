create extension if not exists "pgcrypto";

do $$
begin
  create type public.quote_status as enum ('draft', 'sent', 'accepted', 'rejected', 'paid');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  owner_name text,
  email text,
  phone text,
  address text,
  tax_number text,
  bank_account text,
  default_vat_rate numeric(5,2) not null default 27,
  quote_footer_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  company_name text,
  email text,
  phone text,
  address text,
  tax_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.quote_number_seq;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  client_id uuid references public.clients(id) on delete set null,
  quote_number text not null,
  title text not null,
  description text,
  status public.quote_status not null default 'draft',
  vat_rate numeric(5,2) not null default 27,
  subtotal numeric(12,2) not null default 0,
  vat_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_user_quote_number_unique unique (user_id, quote_number)
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  name text not null,
  description text,
  quantity numeric(12,2) not null default 1,
  unit text not null default 'db',
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_default_vat_rate_check'
  ) then
    alter table public.profiles
      add constraint profiles_default_vat_rate_check
      check (default_vat_rate >= 0 and default_vat_rate <= 100);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'quotes_amounts_check'
  ) then
    alter table public.quotes
      add constraint quotes_amounts_check
      check (
        vat_rate >= 0
        and vat_rate <= 100
        and subtotal >= 0
        and vat_amount >= 0
        and total >= 0
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'quote_items_amounts_check'
  ) then
    alter table public.quote_items
      add constraint quote_items_amounts_check
      check (quantity > 0 and unit_price >= 0 and line_total >= 0);
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists set_quotes_updated_at on public.quotes;
create trigger set_quotes_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

create or replace function public.generate_quote_number()
returns trigger as $$
begin
  if new.quote_number is null or trim(new.quote_number) = '' then
    new.quote_number :=
      'MQ-' ||
      to_char(now(), 'YYYY') ||
      '-' ||
      lpad(nextval('public.quote_number_seq')::text, 5, '0');
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists generate_quote_number_before_insert on public.quotes;
create trigger generate_quote_number_before_insert
before insert on public.quotes
for each row execute function public.generate_quote_number();

create or replace function public.set_quote_item_line_total()
returns trigger as $$
begin
  new.line_total = round(coalesce(new.quantity, 0) * coalesce(new.unit_price, 0), 2);
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_quote_item_line_total_before_insert on public.quote_items;
create trigger set_quote_item_line_total_before_insert
before insert on public.quote_items
for each row execute function public.set_quote_item_line_total();

drop trigger if exists set_quote_item_line_total_before_update on public.quote_items;
create trigger set_quote_item_line_total_before_update
before update on public.quote_items
for each row execute function public.set_quote_item_line_total();

create or replace function public.enforce_quote_totals()
returns trigger as $$
declare
  v_subtotal numeric(12,2);
begin
  select coalesce(sum(line_total), 0)
  into v_subtotal
  from public.quote_items
  where quote_id = new.id;

  new.subtotal = v_subtotal;
  new.vat_amount = round(v_subtotal * new.vat_rate / 100, 2);
  new.total = new.subtotal + new.vat_amount;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists enforce_quote_totals_before_insert on public.quotes;
create trigger enforce_quote_totals_before_insert
before insert on public.quotes
for each row execute function public.enforce_quote_totals();

drop trigger if exists enforce_quote_totals_before_update on public.quotes;
create trigger enforce_quote_totals_before_update
before update on public.quotes
for each row execute function public.enforce_quote_totals();

create or replace function public.refresh_quote_totals(p_quote_id uuid)
returns void as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.quotes q
    where q.id = p_quote_id and q.user_id = auth.uid()
  ) then
    raise exception 'Not allowed to refresh this quote'
      using errcode = '42501';
  end if;

  update public.quotes q
  set
    subtotal = coalesce(t.subtotal, 0),
    vat_amount = round(coalesce(t.subtotal, 0) * q.vat_rate / 100, 2),
    total = coalesce(t.subtotal, 0) + round(coalesce(t.subtotal, 0) * q.vat_rate / 100, 2),
    updated_at = now()
  from (
    select quote_id, coalesce(sum(line_total), 0) as subtotal
    from public.quote_items
    where quote_id = p_quote_id
    group by quote_id
  ) t
  where q.id = p_quote_id and q.id = t.quote_id;

  update public.quotes q
  set subtotal = 0, vat_amount = 0, total = 0, updated_at = now()
  where q.id = p_quote_id
    and not exists (
      select 1 from public.quote_items qi where qi.quote_id = p_quote_id
    );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.refresh_quote_totals_from_quote()
returns trigger as $$
begin
  perform public.refresh_quote_totals(new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists refresh_quote_totals_after_vat_change on public.quotes;
create trigger refresh_quote_totals_after_vat_change
after update of vat_rate on public.quotes
for each row
when (old.vat_rate is distinct from new.vat_rate)
execute function public.refresh_quote_totals_from_quote();

create or replace function public.refresh_quote_totals_from_items()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from public.quotes q where q.id = old.quote_id) then
      perform public.refresh_quote_totals(old.quote_id);
    end if;
    return old;
  end if;

  perform public.refresh_quote_totals(new.quote_id);

  if tg_op = 'UPDATE' and old.quote_id <> new.quote_id then
    if exists (select 1 from public.quotes q where q.id = old.quote_id) then
      perform public.refresh_quote_totals(old.quote_id);
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists refresh_quote_totals_after_item_change on public.quote_items;
create trigger refresh_quote_totals_after_item_change
after insert or update or delete on public.quote_items
for each row execute function public.refresh_quote_totals_from_items();

create or replace function public.create_quote_with_items(
  p_client_id uuid,
  p_title text,
  p_description text,
  p_status public.quote_status,
  p_vat_rate numeric,
  p_valid_until date,
  p_items jsonb
)
returns public.quotes as $$
declare
  v_quote public.quotes;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_client_id is null then
    raise exception 'Client is required';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'Quote title is required';
  end if;

  if p_vat_rate is null or p_vat_rate < 0 or p_vat_rate > 100 then
    raise exception 'VAT rate must be between 0 and 100';
  end if;

  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one quote item is required';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(
      name text,
      description text,
      quantity numeric,
      unit text,
      unit_price numeric
    )
    where btrim(coalesce(item.name, '')) = ''
      or coalesce(item.quantity, 0) <= 0
      or coalesce(item.unit_price, -1) < 0
      or btrim(coalesce(item.unit, '')) = ''
  ) then
    raise exception 'Invalid quote item';
  end if;

  insert into public.quotes (
    user_id,
    client_id,
    title,
    description,
    status,
    vat_rate,
    valid_until
  )
  values (
    auth.uid(),
    p_client_id,
    btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''),
    coalesce(p_status, 'draft'),
    p_vat_rate,
    p_valid_until
  )
  returning * into v_quote;

  insert into public.quote_items (
    quote_id,
    name,
    description,
    quantity,
    unit,
    unit_price
  )
  select
    v_quote.id,
    btrim(item.name),
    nullif(btrim(coalesce(item.description, '')), ''),
    item.quantity,
    btrim(item.unit),
    item.unit_price
  from jsonb_to_recordset(p_items) as item(
    name text,
    description text,
    quantity numeric,
    unit text,
    unit_price numeric
  );

  perform public.refresh_quote_totals(v_quote.id);

  select * into v_quote
  from public.quotes
  where id = v_quote.id;

  return v_quote;
end;
$$ language plpgsql security invoker set search_path = public;

create or replace function public.update_quote_with_items(
  p_quote_id uuid,
  p_client_id uuid,
  p_title text,
  p_description text,
  p_status public.quote_status,
  p_vat_rate numeric,
  p_valid_until date,
  p_items jsonb
)
returns public.quotes as $$
declare
  v_quote public.quotes;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_quote_id is null then
    raise exception 'Quote id is required';
  end if;

  if p_client_id is null then
    raise exception 'Client is required';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'Quote title is required';
  end if;

  if p_vat_rate is null or p_vat_rate < 0 or p_vat_rate > 100 then
    raise exception 'VAT rate must be between 0 and 100';
  end if;

  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one quote item is required';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(
      name text,
      description text,
      quantity numeric,
      unit text,
      unit_price numeric
    )
    where btrim(coalesce(item.name, '')) = ''
      or coalesce(item.quantity, 0) <= 0
      or coalesce(item.unit_price, -1) < 0
      or btrim(coalesce(item.unit, '')) = ''
  ) then
    raise exception 'Invalid quote item';
  end if;

  update public.quotes
  set
    client_id = p_client_id,
    title = btrim(p_title),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    status = coalesce(p_status, 'draft'),
    vat_rate = p_vat_rate,
    valid_until = p_valid_until
  where id = p_quote_id
  returning * into v_quote;

  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;

  delete from public.quote_items
  where quote_id = p_quote_id;

  insert into public.quote_items (
    quote_id,
    name,
    description,
    quantity,
    unit,
    unit_price
  )
  select
    p_quote_id,
    btrim(item.name),
    nullif(btrim(coalesce(item.description, '')), ''),
    item.quantity,
    btrim(item.unit),
    item.unit_price
  from jsonb_to_recordset(p_items) as item(
    name text,
    description text,
    quantity numeric,
    unit text,
    unit_price numeric
  );

  perform public.refresh_quote_totals(p_quote_id);

  select * into v_quote
  from public.quotes
  where id = p_quote_id;

  return v_quote;
end;
$$ language plpgsql security invoker set search_path = public;

create or replace function public.create_profile_for_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.generate_quote_number() from public, anon, authenticated;
revoke execute on function public.set_quote_item_line_total() from public, anon, authenticated;
revoke execute on function public.enforce_quote_totals() from public, anon, authenticated;
revoke execute on function public.refresh_quote_totals_from_quote() from public, anon, authenticated;
revoke execute on function public.refresh_quote_totals_from_items() from public, anon, authenticated;
revoke execute on function public.create_profile_for_new_user() from public, anon, authenticated;

revoke execute on function public.refresh_quote_totals(uuid) from public, anon;
grant execute on function public.refresh_quote_totals(uuid) to authenticated;

revoke execute on function public.create_quote_with_items(
  uuid,
  text,
  text,
  public.quote_status,
  numeric,
  date,
  jsonb
) from public, anon;
grant execute on function public.create_quote_with_items(
  uuid,
  text,
  text,
  public.quote_status,
  numeric,
  date,
  jsonb
) to authenticated;

revoke execute on function public.update_quote_with_items(
  uuid,
  uuid,
  text,
  text,
  public.quote_status,
  numeric,
  date,
  jsonb
) from public, anon;
grant execute on function public.update_quote_with_items(
  uuid,
  uuid,
  text,
  text,
  public.quote_status,
  numeric,
  date,
  jsonb
) to authenticated;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles for delete
using (id = auth.uid());

drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own"
on public.clients for select
using (user_id = auth.uid());

drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own"
on public.clients for insert
with check (user_id = auth.uid());

drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own"
on public.clients for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "clients_delete_own" on public.clients;
create policy "clients_delete_own"
on public.clients for delete
using (user_id = auth.uid());

drop policy if exists "quotes_select_own" on public.quotes;
create policy "quotes_select_own"
on public.quotes for select
using (user_id = auth.uid());

drop policy if exists "quotes_insert_own" on public.quotes;
create policy "quotes_insert_own"
on public.quotes for insert
with check (
  user_id = auth.uid()
  and (
    client_id is null
    or exists (
      select 1 from public.clients c
      where c.id = quotes.client_id and c.user_id = auth.uid()
    )
  )
);

drop policy if exists "quotes_update_own" on public.quotes;
create policy "quotes_update_own"
on public.quotes for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    client_id is null
    or exists (
      select 1 from public.clients c
      where c.id = quotes.client_id and c.user_id = auth.uid()
    )
  )
);

drop policy if exists "quotes_delete_own" on public.quotes;
create policy "quotes_delete_own"
on public.quotes for delete
using (user_id = auth.uid());

drop policy if exists "quote_items_select_own" on public.quote_items;
create policy "quote_items_select_own"
on public.quote_items for select
using (
  exists (
    select 1 from public.quotes q
    where q.id = quote_items.quote_id and q.user_id = auth.uid()
  )
);

drop policy if exists "quote_items_insert_own" on public.quote_items;
create policy "quote_items_insert_own"
on public.quote_items for insert
with check (
  exists (
    select 1 from public.quotes q
    where q.id = quote_items.quote_id and q.user_id = auth.uid()
  )
);

drop policy if exists "quote_items_update_own" on public.quote_items;
create policy "quote_items_update_own"
on public.quote_items for update
using (
  exists (
    select 1 from public.quotes q
    where q.id = quote_items.quote_id and q.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.quotes q
    where q.id = quote_items.quote_id and q.user_id = auth.uid()
  )
);

drop policy if exists "quote_items_delete_own" on public.quote_items;
create policy "quote_items_delete_own"
on public.quote_items for delete
using (
  exists (
    select 1 from public.quotes q
    where q.id = quote_items.quote_id and q.user_id = auth.uid()
  )
);

create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists quotes_user_id_idx on public.quotes(user_id);
create index if not exists quotes_client_id_idx on public.quotes(client_id);
create index if not exists quote_items_quote_id_idx on public.quote_items(quote_id);
