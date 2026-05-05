"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ClientForm } from "@/components/clients/ClientForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { supabase } from "@/lib/supabaseClient";
import { emptyToNull } from "@/lib/utils";
import type { ClientFormValues } from "@/types/client";
import type { ClientRow, Database } from "@/types/database";

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<ClientRow | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadClient() {
      setIsLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();

      if (loadError) {
        setError(loadError.message);
      } else {
        setClient(data);
      }

      setIsLoading(false);
    }

    loadClient();
  }, [params.id]);

  const initialValues = useMemo<ClientFormValues | undefined>(() => {
    if (!client) {
      return undefined;
    }

    return {
      address: client.address ?? "",
      company_name: client.company_name ?? "",
      email: client.email ?? "",
      name: client.name,
      notes: client.notes ?? "",
      phone: client.phone ?? "",
      tax_number: client.tax_number ?? "",
    };
  }, [client]);

  async function handleSubmit(values: ClientFormValues) {
    const payload: Database["public"]["Tables"]["clients"]["Update"] = {
      address: emptyToNull(values.address),
      company_name: emptyToNull(values.company_name),
      email: emptyToNull(values.email),
      name: values.name.trim(),
      notes: emptyToNull(values.notes),
      phone: emptyToNull(values.phone),
      tax_number: emptyToNull(values.tax_number),
    };

    const { error: updateError } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", params.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    router.push(`/clients/${params.id}`);
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!client || !initialValues) {
    return <EmptyState title="Az ügyfél nem található" />;
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Ügyfél szerkesztése</h1>
        <p className="mt-1 text-sm text-slate-500">
          Frissítsd az ügyfél adatait.
        </p>
      </div>
      <ClientForm
        cancelHref={`/clients/${params.id}`}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Módosítások mentése"
      />
    </div>
  );
}
