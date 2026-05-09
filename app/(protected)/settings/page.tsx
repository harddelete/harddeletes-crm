"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  emptyProfileForm,
  SettingsForm,
} from "@/components/settings/SettingsForm";
import { ExcelBackupButton } from "@/components/settings/ExcelBackupButton";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { supabase } from "@/lib/supabaseClient";
import { emptyToNull } from "@/lib/utils";
import type { Database, ProfileRow } from "@/types/database";
import type { ProfileFormValues } from "@/types/profile";

export default function SettingsPage() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        return;
      }

      setIsLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (loadError) {
        setError(loadError.message);
      } else {
        setProfile(data);
      }

      setIsLoading(false);
    }

    loadProfile();
  }, [user]);

  const initialValues = useMemo<ProfileFormValues>(() => {
    if (!profile) {
      return {
        ...emptyProfileForm,
        email: user?.email ?? "",
      };
    }

    return {
      address: profile.address ?? "",
      bank_account: profile.bank_account ?? "",
      company_name: profile.company_name ?? "",
      default_vat_rate: profile.default_vat_rate,
      email: profile.email ?? user?.email ?? "",
      owner_name: profile.owner_name ?? "",
      phone: profile.phone ?? "",
      quote_footer_text:
        profile.quote_footer_text ?? emptyProfileForm.quote_footer_text,
      tax_number: profile.tax_number ?? "",
    };
  }, [profile, user?.email]);

  async function handleSubmit(values: ProfileFormValues) {
    if (!user) {
      throw new Error("A mentéshez be kell jelentkezni.");
    }

    const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
      address: emptyToNull(values.address),
      bank_account: emptyToNull(values.bank_account),
      company_name: emptyToNull(values.company_name),
      default_vat_rate: values.default_vat_rate,
      email: emptyToNull(values.email),
      id: user.id,
      owner_name: emptyToNull(values.owner_name),
      phone: emptyToNull(values.phone),
      quote_footer_text: emptyToNull(values.quote_footer_text),
      tax_number: emptyToNull(values.tax_number),
    };

    const { data, error: saveError } = await supabase
      .from("profiles")
      .upsert(payload)
      .select("*")
      .single();

    if (saveError) {
      throw new Error(saveError.message);
    }

    setProfile(data);
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Beállítások</h1>
        <p className="mt-1 text-sm text-slate-500">
          A céges adatok megjelennek a PDF árajánlatokon.
        </p>
      </div>

      {error ? <ErrorMessage message={error} /> : null}
      <SettingsForm initialValues={initialValues} onSubmit={handleSubmit} />
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">Adatmentés</h2>
          <p className="mt-1 text-sm text-slate-500">
            Töltsd le a CRM adataidat egy rendezett Excel fájlba biztonsági
            mentésként.
          </p>
        </CardHeader>
        <CardContent>
          <ExcelBackupButton />
        </CardContent>
      </Card>
    </div>
  );
}
