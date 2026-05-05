"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { JobForm } from "@/components/jobs/JobForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { supabase } from "@/lib/supabaseClient";
import { emptyToNull } from "@/lib/utils";
import type { ClientRow, Database, JobRow, QuoteRow } from "@/types/database";
import type { JobFormValues } from "@/types/job";

export default function EditJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [job, setJob] = useState<JobRow | null>(null);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [jobResult, clientsResult, quotesResult] = await Promise.all([
        supabase.from("jobs").select("*").eq("id", params.id).maybeSingle(),
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

      if (jobResult.error) {
        setError(jobResult.error.message);
      } else {
        setJob(jobResult.data);
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
  }, [params.id]);

  const initialValues = useMemo<JobFormValues | undefined>(() => {
    if (!job) {
      return undefined;
    }

    return {
      address: job.address ?? "",
      city: job.city ?? "",
      client_id: job.client_id ?? "",
      contact_email: job.contact_email ?? "",
      contact_name: job.contact_name ?? "",
      contact_phone: job.contact_phone ?? "",
      description: job.description ?? "",
      end_time: job.end_time?.slice(0, 5) ?? "",
      event_date: job.event_date,
      event_type: job.event_type ?? "",
      expected_participants: job.expected_participants,
      internal_notes: job.internal_notes ?? "",
      location_name: job.location_name ?? "",
      price: job.price,
      quote_id: job.quote_id ?? "",
      start_time: job.start_time?.slice(0, 5) ?? "",
      status: job.status,
      title: job.title,
    };
  }, [job]);

  async function handleSubmit(values: JobFormValues) {
    const payload: Database["public"]["Tables"]["jobs"]["Update"] = {
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
    };

    const { error: updateError } = await supabase
      .from("jobs")
      .update(payload)
      .eq("id", params.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    router.push(`/jobs/${params.id}`);
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!job || !initialValues) {
    return <EmptyState title="A munka nem található" />;
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">
          Munka szerkesztése
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Frissítsd a rendezvény adatait.
        </p>
      </div>
      <JobForm
        cancelHref={`/jobs/${params.id}`}
        clients={clients}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        quotes={quotes}
        submitLabel="Módosítások mentése"
      />
    </div>
  );
}
