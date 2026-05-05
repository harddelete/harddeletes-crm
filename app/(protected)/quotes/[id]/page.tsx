"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Download, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, TBody, Td, THead, Th, Tr } from "@/components/ui/Table";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { generateQuotePdf } from "@/lib/pdf";
import { quoteStatusOptions } from "@/lib/status";
import { supabase } from "@/lib/supabaseClient";
import type {
  ClientRow,
  ProfileRow,
  QuoteItemRow,
  QuoteRow,
} from "@/types/database";
import type { QuoteStatus } from "@/types/quote";

export default function QuoteDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [client, setClient] = useState<ClientRow | null>(null);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<QuoteItemRow[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [quote, setQuote] = useState<QuoteRow | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function loadQuote() {
      if (!user) {
        return;
      }

      setIsLoading(true);
      setError("");

      const quoteResult = await supabase
        .from("quotes")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();

      if (quoteResult.error) {
        setError(quoteResult.error.message);
        setIsLoading(false);
        return;
      }

      if (!quoteResult.data) {
        setQuote(null);
        setIsLoading(false);
        return;
      }

      const loadedQuote = quoteResult.data;
      setQuote(loadedQuote);

      const [itemsResult, clientResult, profileResult] = await Promise.all([
        supabase
          .from("quote_items")
          .select("*")
          .eq("quote_id", loadedQuote.id)
          .order("created_at", { ascending: true }),
        loadedQuote.client_id
          ? supabase
              .from("clients")
              .select("*")
              .eq("id", loadedQuote.client_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);

      if (itemsResult.error) {
        setError(itemsResult.error.message);
      } else {
        setItems(itemsResult.data ?? []);
      }

      if (clientResult.error) {
        setError(clientResult.error.message);
      } else {
        setClient(clientResult.data);
      }

      if (profileResult.error) {
        setError(profileResult.error.message);
      } else {
        setProfile(profileResult.data);
      }

      setIsLoading(false);
    }

    loadQuote();
  }, [params.id, user]);

  const status = quote?.status ?? "draft";

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  async function handleStatusChange(statusValue: QuoteStatus) {
    if (!quote) {
      return;
    }

    const { error: updateError } = await supabase
      .from("quotes")
      .update({ status: statusValue })
      .eq("id", quote.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setQuote({ ...quote, status: statusValue });
  }

  async function handleDelete() {
    if (!quote) {
      return;
    }

    setIsDeleting(true);
    const { error: deleteError } = await supabase
      .from("quotes")
      .delete()
      .eq("id", quote.id);
    setIsDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.push("/quotes");
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (!quote) {
    return (
      <EmptyState
        action={
          <Link className={buttonClasses({})} href="/quotes">
            Vissza az árajánlatokhoz
          </Link>
        }
        title="Az árajánlat nem található"
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={quote.status} />
            <span className="text-sm text-slate-500">{quote.quote_number}</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">{quote.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Létrehozva: {formatDate(quote.created_at)} · Érvényes:{" "}
            {formatDate(quote.valid_until)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => generateQuotePdf({ client, items, profile, quote })}
            variant="secondary"
          >
            <Download size={18} />
            PDF letöltése
          </Button>
          <Link
            className={buttonClasses({ variant: "outline" })}
            href={`/quotes/${quote.id}/edit`}
          >
            <Pencil size={18} />
            Szerkesztés
          </Link>
          <Button onClick={() => setShowDeleteDialog(true)} variant="danger">
            <Trash2 size={18} />
            Törlés
          </Button>
        </div>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">
                Ajánlat adatai
              </h2>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Info label="Ügyfél" value={client?.company_name || client?.name || "Nincs ügyfél"} />
              <Info label="Ajánlatszám" value={quote.quote_number} />
              <Info label="Érvényes" value={formatDate(quote.valid_until)} />
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Státusz
                </dt>
                <dd className="mt-1">
                  <Select
                    aria-label="Státusz"
                    onChange={(event) =>
                      handleStatusChange(event.target.value as QuoteStatus)
                    }
                    value={status}
                  >
                    {quoteStatusOptions.map((statusOption) => (
                      <option key={statusOption.value} value={statusOption.value}>
                        {statusOption.label}
                      </option>
                    ))}
                  </Select>
                </dd>
              </div>
              {quote.description ? (
                <div className="md:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-slate-500">
                    Leírás
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700">
                    {quote.description}
                  </dd>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">Tételek</h2>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <Tr>
                    <Th>Megnevezés</Th>
                    <Th>Leírás</Th>
                    <Th className="text-right">Mennyiség</Th>
                    <Th>Egység</Th>
                    <Th className="text-right">Egységár</Th>
                    <Th className="text-right">Összeg</Th>
                  </Tr>
                </THead>
                <TBody>
                  {items.map((item) => (
                    <Tr key={item.id}>
                      <Td className="font-semibold text-slate-950">{item.name}</Td>
                      <Td>{item.description || "-"}</Td>
                      <Td className="text-right">{item.quantity}</Td>
                      <Td>{item.unit}</Td>
                      <Td className="text-right">
                        {formatCurrency(item.unit_price)}
                      </Td>
                      <Td className="text-right font-semibold text-slate-950">
                        {formatCurrency(item.line_total)}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 content-start">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">Összesítés</h2>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Summary label="Tételek száma" value={String(items.length)} />
              <Summary label="Összes mennyiség" value={String(totalItems)} />
              <Summary label="Nettó összeg" value={formatCurrency(quote.subtotal)} />
              <Summary
                label={`ÁFA (${quote.vat_rate}%)`}
                value={formatCurrency(quote.vat_amount)}
              />
              <div className="border-t border-slate-200 pt-3">
                <Summary
                  emphasized
                  label="Bruttó végösszeg"
                  value={formatCurrency(quote.total)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">Ügyfél</h2>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">
                {client?.company_name || client?.name || "Törölt ügyfél"}
              </p>
              <p>{client?.email || "-"}</p>
              <p>{client?.phone || "-"}</p>
              <p>{client?.address || "-"}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        description="Az árajánlat és a hozzá tartozó tételek törlődnek."
        isOpen={showDeleteDialog}
        isWorking={isDeleting}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Biztosan törlöd az árajánlatot?"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{value}</dd>
    </div>
  );
}

function Summary({
  emphasized,
  label,
  value,
}: {
  emphasized?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={emphasized ? "font-semibold text-slate-950" : "text-sm text-slate-600"}>
        {label}
      </span>
      <strong className={emphasized ? "text-lg text-slate-950" : "text-sm text-slate-950"}>
        {value}
      </strong>
    </div>
  );
}
