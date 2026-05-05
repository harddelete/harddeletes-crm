"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  equipmentStatusLabels,
  getEquipmentStatusTone,
} from "@/lib/equipmentStatus";
import { supabase } from "@/lib/supabaseClient";
import { formatDate } from "@/lib/calculations";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { TextBadge } from "@/components/ui/Badge";
import type { EquipmentRow } from "@/types/database";

export default function EquipmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [equipment, setEquipment] = useState<EquipmentRow | null>(null);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  async function handleDelete() {
    if (!equipment) {
      return;
    }

    setIsDeleting(true);
    const { error: deleteError } = await supabase
      .from("equipment")
      .delete()
      .eq("id", equipment.id);
    setIsDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.push("/equipment");
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (!equipment) {
    return <EmptyState title="Az eszköz nem található" />;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <TextBadge tone={getEquipmentStatusTone(equipment.status)}>
              {equipmentStatusLabels[equipment.status]}
            </TextBadge>
            <TextBadge tone={equipment.is_active ? "emerald" : "slate"}>
              {equipment.is_active ? "Aktív" : "Inaktív"}
            </TextBadge>
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">
            {equipment.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {equipment.type || "Nincs megadott típus"}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className={buttonClasses({ variant: "outline" })}
            href={`/equipment/${equipment.id}/edit`}
          >
            Szerkesztés
          </Link>
          <Button onClick={() => setShowDeleteDialog(true)} variant="danger">
            Törlés
          </Button>
        </div>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">
            Eszköz adatai
          </h2>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <Info label="Típus" value={equipment.type} />
            <Info label="Azonosító" value={equipment.identifier} />
            <Info
              label="Kapacitás"
              value={equipment.capacity === null ? null : String(equipment.capacity)}
            />
            <Info label="Létrehozva" value={formatDate(equipment.created_at)} />
          </dl>
          {equipment.notes ? (
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
              {equipment.notes}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ConfirmDialog
        description="Az eszköz törlése a munkákhoz kapcsolt hozzárendeléseket is törölheti."
        isOpen={showDeleteDialog}
        isWorking={isDeleting}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Biztosan törlöd az eszközt?"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{value || "-"}</dd>
    </div>
  );
}
