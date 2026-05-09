"use client";

import { useRouter } from "next/navigation";
import { EquipmentForm } from "@/components/equipment/EquipmentForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { emptyToNull } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { EquipmentFormValues } from "@/types/equipment";

export default function NewEquipmentPage() {
  const router = useRouter();
  const { user } = useAuth();

  async function handleSubmit(values: EquipmentFormValues) {
    if (!user) {
      throw new Error("A mentéshez be kell jelentkezni.");
    }

    const payload: Database["public"]["Tables"]["equipment"]["Insert"] = {
      capacity: values.capacity,
      identifier: emptyToNull(values.identifier),
      is_active: values.is_active,
      name: values.name.trim(),
      notes: emptyToNull(values.notes),
      status: values.status,
      type: emptyToNull(values.type),
      user_id: user.id,
    };

    const { error } = await supabase.from("equipment").insert(payload);

    if (error) {
      throw new Error(error.message);
    }

    router.push("/equipment");
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Új eszköz</h1>
        <p className="mt-1 text-sm text-slate-500">
          Rögzítsd a ládavasútat vagy rendezvényes eszközt.
        </p>
      </div>
      <EquipmentForm onSubmit={handleSubmit} submitLabel="Eszköz felvétele" />
    </div>
  );
}
