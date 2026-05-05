"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, TBody, Td, THead, Th, Tr } from "@/components/ui/Table";
import type { ClientRow, QuoteRow } from "@/types/database";

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<ClientRow | null>(null);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function loadClient() {
      setIsLoading(true);
      setError("");

      const [clientResult, quotesResult] = await Promise.all([
        supabase.from("clients").select("*").eq("id", params.id).maybeSingle(),
        supabase
          .from("quotes")
          .select("*")
          .eq("client_id", params.id)
          .order("created_at", { ascending: false }),
      ]);

      if (clientResult.error) {
        setError(clientResult.error.message);
      } else {
        setClient(clientResult.data);
      }

      if (quotesResult.error) {
        setError(quotesResult.error.message);
      } else {
        setQuotes(quotesResult.data ?? []);
      }

      setIsLoading(false);
    }

    loadClient();
  }, [params.id]);

  async function handleDelete() {
    if (!client) {
      return;
    }

    setIsDeleting(true);
    const { error: deleteError } = await supabase
      .from("clients")
      .delete()
      .eq("id", client.id);
    setIsDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.push("/clients");
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (!client) {
    return (
      <EmptyState
        action={
          <Link className={buttonClasses({})} href="/clients">
            Vissza az ügyfelekhez
          </Link>
        }
        title="Az ügyfél nem található"
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">{client.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {client.company_name || "Magánszemély"}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className={buttonClasses({ variant: "outline" })}
            href={`/clients/${client.id}/edit`}
          >
            Szerkesztés
          </Link>
          <Button onClick={() => setShowDeleteDialog(true)} variant="danger">
            Törlés
          </Button>
        </div>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">Ügyféladatok</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <Info label="Cégnév" value={client.company_name} />
            <Info label="Email" value={client.email} />
            <Info label="Telefon" value={client.phone} />
            <Info label="Cím" value={client.address} />
            <Info label="Adószám" value={client.tax_number} />
            <Info label="Létrehozva" value={formatDate(client.created_at)} />
          </dl>
          {client.notes ? (
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
              {client.notes}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-950">
            Kapcsolódó árajánlatok
          </h2>
          <Link className={buttonClasses({ size: "sm" })} href="/quotes/new">
            Új árajánlat
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {quotes.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<FileText size={32} />}
                title="Még nincs ajánlat ehhez az ügyfélhez"
              />
            </div>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Ajánlatszám</Th>
                  <Th>Cím</Th>
                  <Th>Státusz</Th>
                  <Th className="text-right">Bruttó</Th>
                  <Th>Dátum</Th>
                </Tr>
              </THead>
              <TBody>
                {quotes.map((quote) => (
                  <Tr key={quote.id}>
                    <Td>
                      <Link
                        className="font-semibold text-teal-700"
                        href={`/quotes/${quote.id}`}
                      >
                        {quote.quote_number}
                      </Link>
                    </Td>
                    <Td>{quote.title}</Td>
                    <Td>
                      <StatusBadge status={quote.status} />
                    </Td>
                    <Td className="text-right font-semibold text-slate-950">
                      {formatCurrency(quote.total)}
                    </Td>
                    <Td>{formatDate(quote.created_at)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        description="Az ügyfél törlése után az adatai nem állíthatók vissza."
        isOpen={showDeleteDialog}
        isWorking={isDeleting}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Biztosan törlöd az ügyfelet?"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{value || "-"}</dd>
    </div>
  );
}
