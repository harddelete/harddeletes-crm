"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { QuoteForm } from "@/components/quotes/QuoteForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { updateQuoteWithItems } from "@/lib/quoteMutations";
import { supabase } from "@/lib/supabaseClient";
import type { ClientRow, QuoteItemRow, QuoteRow } from "@/types/database";
import type { QuoteFormSubmission, QuoteFormValues } from "@/types/quote";

export default function EditQuotePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<QuoteItemRow[]>([]);
  const [quote, setQuote] = useState<QuoteRow | null>(null);

  useEffect(() => {
    async function loadQuote() {
      setIsLoading(true);
      setError("");

      const [quoteResult, itemsResult, clientsResult] = await Promise.all([
        supabase.from("quotes").select("*").eq("id", params.id).maybeSingle(),
        supabase
          .from("quote_items")
          .select("*")
          .eq("quote_id", params.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (quoteResult.error) {
        setError(quoteResult.error.message);
      } else {
        setQuote(quoteResult.data);
      }

      if (itemsResult.error) {
        setError(itemsResult.error.message);
      } else {
        setItems(itemsResult.data ?? []);
      }

      if (clientsResult.error) {
        setError(clientsResult.error.message);
      } else {
        setClients(clientsResult.data ?? []);
      }

      setIsLoading(false);
    }

    loadQuote();
  }, [params.id]);

  const initialValues = useMemo<QuoteFormValues | undefined>(() => {
    if (!quote) {
      return undefined;
    }

    return {
      client_id: quote.client_id ?? "",
      description: quote.description ?? "",
      items:
        items.length > 0
          ? items.map((item) => ({
              description: item.description ?? "",
              id: item.id,
              line_total: item.line_total,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
            }))
          : [
              {
                description: "",
                line_total: 0,
                name: "",
                quantity: 1,
                unit: "db",
                unit_price: 0,
              },
            ],
      status: quote.status,
      title: quote.title,
      valid_until: quote.valid_until ?? "",
      vat_rate: quote.vat_rate,
    };
  }, [items, quote]);

  async function handleSubmit(values: QuoteFormSubmission) {
    await updateQuoteWithItems(params.id, values);
    router.push(`/quotes/${params.id}`);
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!quote || !initialValues) {
    return <EmptyState title="Az árajánlat nem található" />;
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">
          Árajánlat szerkesztése
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Frissítsd az ajánlat adatait és tételeit.
        </p>
      </div>
      <QuoteForm
        cancelHref={`/quotes/${params.id}`}
        clients={clients}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Módosítások mentése"
      />
    </div>
  );
}
