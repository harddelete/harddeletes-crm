"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { supabase } from "@/lib/supabaseClient";
import { emptyToNull } from "@/lib/utils";
import type { EmployeeFormValues } from "@/types/employee";
import type { Database, EmployeeRow } from "@/types/database";

export default function EditEmployeePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeRow | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployee() {
      const { data, error: loadError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (loadError) {
        setError(loadError.message);
      } else {
        setEmployee(data);
      }

      setIsLoading(false);
    }

    void loadEmployee();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const initialValues = useMemo<EmployeeFormValues | undefined>(() => {
    if (!employee) {
      return undefined;
    }

    return {
      email: employee.email ?? "",
      employment_type: employee.employment_type,
      hourly_rate: employee.hourly_rate,
      is_active: employee.is_active,
      job_title: employee.job_title ?? "",
      name: employee.name,
      notes: employee.notes ?? "",
      phone: employee.phone ?? "",
      position: employee.position ?? "",
    };
  }, [employee]);

  async function handleSubmit(values: EmployeeFormValues) {
    const payload: Database["public"]["Tables"]["employees"]["Update"] = {
      email: emptyToNull(values.email),
      employment_type: values.employment_type,
      hourly_rate: values.hourly_rate,
      is_active: values.is_active,
      job_title: emptyToNull(values.job_title),
      name: values.name.trim(),
      notes: emptyToNull(values.notes),
      phone: emptyToNull(values.phone),
      position: emptyToNull(values.position),
    };

    const { error: updateError } = await supabase
      .from("employees")
      .update(payload)
      .eq("id", params.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    router.push(`/employees/${params.id}`);
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!employee || !initialValues) {
    return <EmptyState title="A dolgozó nem található" />;
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">
          Dolgozó szerkesztése
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Frissítsd a dolgozó adatait és státuszát.
        </p>
      </div>
      <EmployeeForm
        cancelHref={`/employees/${params.id}`}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Módosítások mentése"
      />
    </div>
  );
}
