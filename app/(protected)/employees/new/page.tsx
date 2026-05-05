"use client";

import { useRouter } from "next/navigation";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { emptyToNull } from "@/lib/utils";
import type { EmployeeFormValues } from "@/types/employee";
import type { Database } from "@/types/database";

export default function NewEmployeePage() {
  const router = useRouter();
  const { user } = useAuth();

  async function handleSubmit(values: EmployeeFormValues) {
    if (!user) {
      throw new Error("A mentéshez be kell jelentkezni.");
    }

    const payload: Database["public"]["Tables"]["employees"]["Insert"] = {
      email: emptyToNull(values.email),
      employment_type: values.employment_type,
      hourly_rate: values.hourly_rate,
      is_active: values.is_active,
      job_title: emptyToNull(values.job_title),
      name: values.name.trim(),
      notes: emptyToNull(values.notes),
      phone: emptyToNull(values.phone),
      position: emptyToNull(values.position),
      user_id: user.id,
    };

    const { error } = await supabase.from("employees").insert(payload);

    if (error) {
      throw new Error(error.message);
    }

    router.push("/employees");
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Új dolgozó</h1>
        <p className="mt-1 text-sm text-slate-500">
          Rögzítsd a munkatárs szerepkörét és elérhetőségeit.
        </p>
      </div>
      <EmployeeForm onSubmit={handleSubmit} submitLabel="Dolgozó felvétele" />
    </div>
  );
}
