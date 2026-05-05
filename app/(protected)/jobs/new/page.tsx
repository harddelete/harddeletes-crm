"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JobForm } from "@/components/jobs/JobForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { supabase } from "@/lib/supabaseClient";
import { emptyToNull } from "@/lib/utils";
import type { ClientRow, Database, QuoteRow } from "@/types/database";
import type { JobFormValues } from "@/types/job";

export default function NewJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [clientsResult, quotesResult] = await Promise.all([
        supabase
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("quotes")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (!isMounted) {
        return;
      }

      if (clientsResult.error) {
        setError(clientsResult.error.message);
      } else {
        setClients(clientsResult.data ?? []);
      }

      if (quotesResult.error) {
        setError(quotesResult.error.message);
      } else {
        setQuotes(quotesResult.data ?? []);
      }

      setIsLoading(false);
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(values: JobFormValues) {
    if (!user) {
      throw new Error("A mentéshez be kell jelentkezni.");
    }

    const payload: Database["public"]["Tables"]["jobs"]["Insert"] = {
      address: emptyToNull(values.address),
      city: emptyToNull(values.city),
      client_id: emptyToNull(values.client_id),
      contact_email: emptyToNull(values.contact_email),
      contact_name: emptyToNull(values.contact_name),
      contact_phone: emptyToNull(values.contact_phone),
      description: emptyToNull(values.description),
      end_time: emptyToNull(values.end_time),
      event_date: values.event_date,
      event_type: emptyToNull(values.event_type),
      expected_participants: values.expected_participants,
      internal_notes: emptyToNull(values.internal_notes),
      location_name: emptyToNull(values.location_name),
      price: values.price,
      quote_id: emptyToNull(values.quote_id),
      start_time: emptyToNull(values.start_time),
      status: values.status,
      title: values.title.trim(),
      user_id: user.id,
    };

    const { data, error: insertError } = await supabase
      .from("jobs")
      .insert(payload)
      .select("*")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    router.push(`/jobs/${data.id}`);
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Új munka</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hozz létre egy konkrét kitelepülést vagy rendezvényt.
        </p>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      <JobForm
        clients={clients}
        onSubmit={handleSubmit}
        quotes={quotes}
        submitLabel="Munka létrehozása"
      />
    </div>
  );
}
