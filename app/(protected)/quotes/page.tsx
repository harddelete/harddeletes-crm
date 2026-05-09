"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { quoteStatusOptions } from "@/lib/status";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Table, TBody, Td, THead, Th, Tr } from "@/components/ui/Table";
import type { ClientRow, QuoteRow } from "@/types/database";
import type { QuoteStatus } from "@/types/quote";

type QuoteWithClient = QuoteRow & {
  clientName: string;
};

export default function QuotesPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<QuoteRow | null>(null);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [search, setSearch] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<"all" | QuoteStatus>("all");

  useEffect(() => {
    let isMounted = true;

    async function loadQuotes() {
      const [quotesResult, clientsResult] = await Promise.all([
        supabase
          .from("quotes")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("clients").select("*"),
      ]);

      if (!isMounted) {
        return;
      }

      if (quotesResult.error) {
        setError(quotesResult.error.message);
      } else {
        setQuotes(quotesResult.data ?? []);
      }

      if (clientsResult.error) {
        setError(clientsResult.error.message);
      } else {
        setClients(clientsResult.data ?? []);
      }

      setIsLoading(false);
    }

    void loadQuotes();

    return () => {
      isMounted = false;
    };
  }, []);

  const clientMap = useMemo(() => {
    return new Map(
      clients.map((client) => [
        client.id,
        client.company_name || client.name,
      ]),
    );
  }, [clients]);

  const filteredQuotes = useMemo<QuoteWithClient[]>(() => {
    const term = search.trim().toLowerCase();

    return quotes
      .map((quote) => ({
        ...quote,
        clientName: quote.client_id
          ? clientMap.get(quote.client_id) ?? "Törölt ügyfél"
          : "Nincs ügyfél",
      }))
      .filter((quote) => {
        const matchesSearch =
          !term ||
          quote.title.toLowerCase().includes(term) ||
          quote.quote_number.toLowerCase().includes(term);
        const matchesStatus =
          statusFilter === "all" || quote.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((left, right) => {
        const leftTime = new Date(left.created_at).getTime();
        const rightTime = new Date(right.created_at).getTime();
        return sortDirection === "desc" ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [clientMap, quotes, search, sortDirection, statusFilter]);

  async function handleStatusChange(quote: QuoteRow, status: QuoteStatus) {
    const { error: updateError } = await supabase
      .from("quotes")
      .update({ status })
      .eq("id", quote.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setQuotes((current) =>
      current.map((item) => (item.id === quote.id ? { ...item, status } : item)),
    );
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    const { error: deleteError } = await supabase
      .from("quotes")
      .delete()
      .eq("id", deleteTarget.id);
    setIsDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setQuotes((current) =>
      current.filter((quote) => quote.id !== deleteTarget.id),
    );
    setDeleteTarget(null);
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Árajánlatok</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ajánlatok létrehozása, státuszkövetése és PDF exportja.
          </p>
        </div>
        <Link className={buttonClasses({})} href="/quotes/new">
          <Plus size={18} />
          Új árajánlat
        </Link>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      {quotes.length === 0 ? (
        <EmptyState
          action={
            <Link className={buttonClasses({})} href="/quotes/new">
              Készítsd el az első árajánlatodat
            </Link>
          }
          description="Tételekkel, ÁFA számítással és letölthető PDF-fel."
          icon={<FileText size={36} />}
          title="Még nincs árajánlatod"
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <Input
                  className="pl-10"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Keresés"
                  value={search}
                />
              </div>
              <Select
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | QuoteStatus)
                }
                value={statusFilter}
              >
                <option value="all">Minden státusz</option>
                {quoteStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
              <Select
                onChange={(event) =>
                  setSortDirection(event.target.value as "asc" | "desc")
                }
                value={sortDirection}
              >
                <option value="desc">Legújabb elöl</option>
                <option value="asc">Legrégebbi elöl</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredQuotes.length === 0 ? (
              <div className="p-5">
                <EmptyState title="Nincs találat" description="Módosítsd a keresést vagy a szűrőt." />
              </div>
            ) : (
              <Table>
                <THead>
                  <Tr>
                    <Th>Ajánlatszám</Th>
                    <Th>Cím</Th>
                    <Th>Ügyfél</Th>
                    <Th>Státusz</Th>
                    <Th className="text-right">Bruttó</Th>
                    <Th>Dátum</Th>
                    <Th className="text-right">Műveletek</Th>
                  </Tr>
                </THead>
                <TBody>
                  {filteredQuotes.map((quote) => (
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
                      <Td>{quote.clientName}</Td>
                      <Td>
                        <Select
                          aria-label="Státusz"
                          className="h-9 min-w-32"
                          onChange={(event) =>
                            handleStatusChange(
                              quote,
                              event.target.value as QuoteStatus,
                            )
                          }
                          value={quote.status}
                        >
                          {quoteStatusOptions.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </Select>
                      </Td>
                      <Td className="text-right font-semibold text-slate-950">
                        {formatCurrency(quote.total)}
                      </Td>
                      <Td>{formatDate(quote.created_at)}</Td>
                      <Td>
                        <div className="flex justify-end gap-2">
                          <Link
                            className={buttonClasses({
                              size: "sm",
                              variant: "outline",
                            })}
                            href={`/quotes/${quote.id}/edit`}
                          >
                            Szerkesztés
                          </Link>
                          <Button
                            onClick={() => setDeleteTarget(quote)}
                            size="sm"
                            variant="ghost"
                          >
                            Törlés
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        description="Az árajánlat és a hozzá tartozó tételek törlődnek."
        isOpen={Boolean(deleteTarget)}
        isWorking={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Biztosan törlöd az árajánlatot?"
      />
    </div>
  );
}
