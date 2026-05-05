create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  email text,
  phone text,
  job_title text,
  position text,
  employment_type text not null default 'occasional',
  hourly_rate numeric(12,2) not null default 0,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_employment_type_check check (
    employment_type in ('full_time', 'part_time', 'occasional', 'contractor', 'student', 'other')
  ),
  constraint employees_hourly_rate_check check (hourly_rate >= 0)
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  type text,
  identifier text,
  capacity integer,
  status text not null default 'available',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equipment_status_check check (
    status in ('available', 'in_use', 'maintenance', 'broken', 'inactive')
  ),
  constraint equipment_capacity_check check (capacity is null or capacity >= 0)
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  client_id uuid references public.clients(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  title text not null,
  event_type text,
  location_name text,
  address text,
  city text,
  event_date date not null,
  start_time time,
  end_time time,
  contact_name text,
  contact_phone text,
  contact_email text,
  expected_participants integer,
  price numeric(12,2) not null default 0,
  status text not null default 'inquiry',
  description text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_status_check check (
    status in (
      'inquiry',
      'quoted',
      'confirmed',
      'scheduled',
      'in_progress',
      'completed',
      'cancelled',
      'invoiced',
      'paid'
    )
  ),
  constraint jobs_price_check check (price >= 0),
  constraint jobs_expected_participants_check check (
    expected_participants is null or expected_participants >= 0
  ),
  constraint jobs_time_order_check check (
    start_time is null or end_time is null or end_time >= start_time
  )
);

create table if not exists public.job_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  assignment_role text,
  planned_start_time time,
  planned_end_time time,
  actual_start_time time,
  actual_end_time time,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_assignments_planned_time_check check (
    planned_start_time is null or planned_end_time is null or planned_end_time >= planned_start_time
  ),
  constraint job_assignments_actual_time_check check (
    actual_start_time is null or actual_end_time is null or actual_end_time >= actual_start_time
  ),
  constraint job_assignments_unique unique (job_id, employee_id)
);

create table if not exists public.job_equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  quantity integer not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_equipment_quantity_check check (quantity > 0),
  constraint job_equipment_unique unique (job_id, equipment_id)
);

drop trigger if exists set_employees_updated_at on public.employees;
create trigger set_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

drop trigger if exists set_equipment_updated_at on public.equipment;
create trigger set_equipment_updated_at
before update on public.equipment
for each row execute function public.set_updated_at();

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

drop trigger if exists set_job_assignments_updated_at on public.job_assignments;
create trigger set_job_assignments_updated_at
before update on public.job_assignments
for each row execute function public.set_updated_at();

drop trigger if exists set_job_equipment_updated_at on public.job_equipment;
create trigger set_job_equipment_updated_at
before update on public.job_equipment
for each row execute function public.set_updated_at();

alter table public.employees enable row level security;
alter table public.equipment enable row level security;
alter table public.jobs enable row level security;
alter table public.job_assignments enable row level security;
alter table public.job_equipment enable row level security;

drop policy if exists "employees_select_own" on public.employees;
create policy "employees_select_own"
on public.employees for select
using (user_id = auth.uid());

drop policy if exists "employees_insert_own" on public.employees;
create policy "employees_insert_own"
on public.employees for insert
with check (user_id = auth.uid());

drop policy if exists "employees_update_own" on public.employees;
create policy "employees_update_own"
on public.employees for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "employees_delete_own" on public.employees;
create policy "employees_delete_own"
on public.employees for delete
using (user_id = auth.uid());

drop policy if exists "equipment_select_own" on public.equipment;
create policy "equipment_select_own"
on public.equipment for select
using (user_id = auth.uid());

drop policy if exists "equipment_insert_own" on public.equipment;
create policy "equipment_insert_own"
on public.equipment for insert
with check (user_id = auth.uid());

drop policy if exists "equipment_update_own" on public.equipment;
create policy "equipment_update_own"
on public.equipment for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "equipment_delete_own" on public.equipment;
create policy "equipment_delete_own"
on public.equipment for delete
using (user_id = auth.uid());

drop policy if exists "jobs_select_own" on public.jobs;
create policy "jobs_select_own"
on public.jobs for select
using (user_id = auth.uid());

drop policy if exists "jobs_insert_own" on public.jobs;
create policy "jobs_insert_own"
on public.jobs for insert
with check (
  user_id = auth.uid()
  and (
    client_id is null
    or exists (
      select 1 from public.clients c
      where c.id = jobs.client_id and c.user_id = auth.uid()
    )
  )
  and (
    quote_id is null
    or exists (
      select 1 from public.quotes q
      where q.id = jobs.quote_id and q.user_id = auth.uid()
    )
  )
);

drop policy if exists "jobs_update_own" on public.jobs;
create policy "jobs_update_own"
on public.jobs for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    client_id is null
    or exists (
      select 1 from public.clients c
      where c.id = jobs.client_id and c.user_id = auth.uid()
    )
  )
  and (
    quote_id is null
    or exists (
      select 1 from public.quotes q
      where q.id = jobs.quote_id and q.user_id = auth.uid()
    )
  )
);

drop policy if exists "jobs_delete_own" on public.jobs;
create policy "jobs_delete_own"
on public.jobs for delete
using (user_id = auth.uid());

drop policy if exists "job_assignments_select_own" on public.job_assignments;
create policy "job_assignments_select_own"
on public.job_assignments for select
using (user_id = auth.uid());

drop policy if exists "job_assignments_insert_own" on public.job_assignments;
create policy "job_assignments_insert_own"
on public.job_assignments for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.jobs j
    where j.id = job_assignments.job_id and j.user_id = auth.uid()
  )
  and exists (
    select 1 from public.employees e
    where e.id = job_assignments.employee_id and e.user_id = auth.uid()
  )
);

drop policy if exists "job_assignments_update_own" on public.job_assignments;
create policy "job_assignments_update_own"
on public.job_assignments for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.jobs j
    where j.id = job_assignments.job_id and j.user_id = auth.uid()
  )
  and exists (
    select 1 from public.employees e
    where e.id = job_assignments.employee_id and e.user_id = auth.uid()
  )
);

drop policy if exists "job_assignments_delete_own" on public.job_assignments;
create policy "job_assignments_delete_own"
on public.job_assignments for delete
using (user_id = auth.uid());

drop policy if exists "job_equipment_select_own" on public.job_equipment;
create policy "job_equipment_select_own"
on public.job_equipment for select
using (user_id = auth.uid());

drop policy if exists "job_equipment_insert_own" on public.job_equipment;
create policy "job_equipment_insert_own"
on public.job_equipment for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.jobs j
    where j.id = job_equipment.job_id and j.user_id = auth.uid()
  )
  and exists (
    select 1 from public.equipment e
    where e.id = job_equipment.equipment_id and e.user_id = auth.uid()
  )
);

drop policy if exists "job_equipment_update_own" on public.job_equipment;
create policy "job_equipment_update_own"
on public.job_equipment for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.jobs j
    where j.id = job_equipment.job_id and j.user_id = auth.uid()
  )
  and exists (
    select 1 from public.equipment e
    where e.id = job_equipment.equipment_id and e.user_id = auth.uid()
  )
);

drop policy if exists "job_equipment_delete_own" on public.job_equipment;
create policy "job_equipment_delete_own"
on public.job_equipment for delete
using (user_id = auth.uid());

create index if not exists employees_user_id_idx on public.employees(user_id);
create index if not exists equipment_user_id_idx on public.equipment(user_id);
create index if not exists jobs_user_id_idx on public.jobs(user_id);
create index if not exists jobs_client_id_idx on public.jobs(client_id);
create index if not exists jobs_quote_id_idx on public.jobs(quote_id);
create index if not exists jobs_event_date_idx on public.jobs(event_date);
create index if not exists job_assignments_user_id_idx on public.job_assignments(user_id);
create index if not exists job_assignments_job_id_idx on public.job_assignments(job_id);
create index if not exists job_assignments_employee_id_idx on public.job_assignments(employee_id);
create index if not exists job_equipment_user_id_idx on public.job_equipment(user_id);
create index if not exists job_equipment_job_id_idx on public.job_equipment(job_id);
create index if not exists job_equipment_equipment_id_idx on public.job_equipment(equipment_id);
