"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EquipmentForm } from "@/components/equipment/EquipmentForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { supabase } from "@/lib/supabaseClient";
import { emptyToNull } from "@/lib/utils";
import type { Database, EquipmentRow } from "@/types/database";
import type { EquipmentFormValues } from "@/types/equipment";

export default function EditEquipmentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [equipment, setEquipment] = useState<EquipmentRow | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadEquipment() {
      const { data, error: loadError } = await supabase
        .from("equipment")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (loadError) {
        setError(loadError.message);
      } else {
        setEquipment(data);
      }

      setIsLoading(false);
    }

    void loadEquipment();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const initialValues = useMemo<EquipmentFormValues | undefined>(() => {
    if (!equipment) {
      return undefined;
    }

    return {
      capacity: equipment.capacity,
      identifier: equipment.identifier ?? "",
      is_active: equipment.is_active,
      name: equipment.name,
      notes: equipment.notes ?? "",
      status: equipment.status,
      type: equipment.type ?? "",
    };
  }, [equipment]);

  async function handleSubmit(values: EquipmentFormValues) {
    const payload: Database["public"]["Tables"]["equipment"]["Update"] = {
      capacity: values.capacity,
      identifier: emptyToNull(values.identifier),
      is_active: values.is_active,
      name: values.name.trim(),
      notes: emptyToNull(values.notes),
      status: values.status,
      type: emptyToNull(values.type),
    };

    const { error: updateError } = await supabase
      .from("equipment")
      .update(payload)
      .eq("id", params.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    router.push(`/equipment/${params.id}`);
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!equipment || !initialValues) {
    return <EmptyState title="Az eszköz nem található" />;
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">
          Eszköz szerkesztése
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Frissítsd az eszköz adatait és státuszát.
        </p>
      </div>
      <EquipmentForm
        cancelHref={`/equipment/${params.id}`}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Módosítások mentése"
      />
    </div>
  );
}
