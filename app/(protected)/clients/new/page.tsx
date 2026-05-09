"use client";

import { useRouter } from "next/navigation";
import { ClientForm } from "@/components/clients/ClientForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { emptyToNull } from "@/lib/utils";
import type { ClientFormValues } from "@/types/client";
import type { Database } from "@/types/database";

export default function NewClientPage() {
  const router = useRouter();
  const { user } = useAuth();

  async function handleSubmit(values: ClientFormValues) {
    if (!user) {
      throw new Error("A mentéshez be kell jelentkezni.");
    }

    const payload: Database["public"]["Tables"]["clients"]["Insert"] = {
      address: emptyToNull(values.address),
      company_name: emptyToNull(values.company_name),
      email: emptyToNull(values.email),
      name: values.name.trim(),
      notes: emptyToNull(values.notes),
      phone: emptyToNull(values.phone),
      tax_number: emptyToNull(values.tax_number),
      user_id: user.id,
    };

    const { error } = await supabase.from("clients").insert(payload);

    if (error) {
      throw new Error(error.message);
    }

    router.push("/clients");
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Új ügyfél</h1>
        <p className="mt-1 text-sm text-slate-500">
          Rögzítsd az ügyfél alapadatait az ajánlatokhoz.
        </p>
      </div>
      <ClientForm onSubmit={handleSubmit} submitLabel="Ügyfél létrehozása" />
    </div>
  );
}
