"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { QuoteForm } from "@/components/quotes/QuoteForm";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { createQuoteWithItems } from "@/lib/quoteMutations";
import { supabase } from "@/lib/supabaseClient";
import type { ClientRow, ProfileRow } from "@/types/database";
import type { QuoteFormSubmission } from "@/types/quote";

export default function NewQuotePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        return;
      }

      setIsLoading(true);
      setError("");

      const [clientsResult, profileResult] = await Promise.all([
        supabase
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);

      if (clientsResult.error) {
        setError(clientsResult.error.message);
      } else {
        setClients(clientsResult.data ?? []);
      }

      if (profileResult.error) {
        setError(profileResult.error.message);
      } else {
        setProfile(profileResult.data);
      }

      setIsLoading(false);
    }

    loadData();
  }, [user]);

  async function handleSubmit(values: QuoteFormSubmission) {
    const quote = await createQuoteWithItems(values);
    router.push(`/quotes/${quote.id}`);
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (clients.length === 0) {
    return (
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Új árajánlat</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ajánlat készítéséhez előbb szükség van legalább egy ügyfélre.
          </p>
        </div>
        <EmptyState
          action={
            <Link className={buttonClasses({})} href="/clients/new">
              Hozd létre az első ügyfelet
            </Link>
          }
          icon={<Users size={36} />}
          title="Még nincs ügyfeled"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Új árajánlat</h1>
        <p className="mt-1 text-sm text-slate-500">
          Adj hozzá tételeket, a rendszer automatikusan számolja a nettó, ÁFA és bruttó összeget.
        </p>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      <QuoteForm
        clients={clients}
        defaultVatRate={profile?.default_vat_rate ?? 27}
        onSubmit={handleSubmit}
        submitLabel="Árajánlat létrehozása"
      />
    </div>
  );
}
