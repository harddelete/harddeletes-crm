"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Package, Plus, Search } from "lucide-react";
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
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TextBadge } from "@/components/ui/Badge";
import { Table, TBody, Td, THead, Th, Tr } from "@/components/ui/Table";
import type { EquipmentRow } from "@/types/database";

export default function EquipmentPage() {
  const [deleteTarget, setDeleteTarget] = useState<EquipmentRow | null>(null);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadEquipment() {
      const { data, error: loadError } = await supabase
        .from("equipment")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (loadError) {
        setError(loadError.message);
      } else {
        setEquipment(data ?? []);
      }

      setIsLoading(false);
    }

    void loadEquipment();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEquipment = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return equipment;
    }

    return equipment.filter((item) =>
      [item.name, item.type, item.identifier, item.notes].some((value) =>
        value?.toLowerCase().includes(term),
      ),
    );
  }, [equipment, search]);

  async function toggleActive(item: EquipmentRow) {
    const nextValue = !item.is_active;
    const { error: updateError } = await supabase
      .from("equipment")
      .update({
        is_active: nextValue,
        status: nextValue ? item.status : "inactive",
      })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEquipment((current) =>
      current.map((equipmentItem) =>
        equipmentItem.id === item.id
          ? {
              ...equipmentItem,
              is_active: nextValue,
              status: nextValue ? equipmentItem.status : "inactive",
            }
          : equipmentItem,
      ),
    );
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    const { error: deleteError } = await supabase
      .from("equipment")
      .delete()
      .eq("id", deleteTarget.id);
    setIsDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setEquipment((current) =>
      current.filter((item) => item.id !== deleteTarget.id),
    );
    setDeleteTarget(null);
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        actions={
          <Link className={buttonClasses({})} href="/equipment/new">
            <Plus size={18} />
            Új eszköz
          </Link>
        }
        description="Ládavasutak, utánfutók és rendezvényes eszközök kezelése."
        title="Eszközök"
      />

      {error ? <ErrorMessage message={error} /> : null}

      {equipment.length === 0 ? (
        <EmptyState
          action={
            <Link className={buttonClasses({})} href="/equipment/new">
              Vedd fel az első ládavasútat vagy eszközt
            </Link>
          }
          description="Az eszközöket később munkákhoz tudod hozzárendelni."
          icon={<Package size={36} />}
          title="Még nincs eszköz"
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="relative max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <Input
                className="pl-10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Keresés"
                value={search}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredEquipment.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  description="Próbálj más keresési kifejezést."
                  title="Nincs találat"
                />
              </div>
            ) : (
              <Table>
                <THead>
                  <Tr>
                    <Th>Név</Th>
                    <Th>Típus</Th>
                    <Th>Azonosító</Th>
                    <Th>Kapacitás</Th>
                    <Th>Státusz</Th>
                    <Th>Aktivitás</Th>
                    <Th>Létrehozva</Th>
                    <Th className="text-right">Műveletek</Th>
                  </Tr>
                </THead>
                <TBody>
                  {filteredEquipment.map((item) => (
                    <Tr key={item.id}>
                      <Td>
                        <Link
                          className="font-semibold text-teal-700"
                          href={`/equipment/${item.id}`}
                        >
                          {item.name}
                        </Link>
                      </Td>
                      <Td>{item.type || "-"}</Td>
                      <Td>{item.identifier || "-"}</Td>
                      <Td>{item.capacity ?? "-"}</Td>
                      <Td>
                        <TextBadge tone={getEquipmentStatusTone(item.status)}>
                          {equipmentStatusLabels[item.status]}
                        </TextBadge>
                      </Td>
                      <Td>
                        <TextBadge tone={item.is_active ? "emerald" : "slate"}>
                          {item.is_active ? "Aktív" : "Inaktív"}
                        </TextBadge>
                      </Td>
                      <Td>{formatDate(item.created_at)}</Td>
                      <Td>
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => toggleActive(item)}
                            size="sm"
                            variant="outline"
                          >
                            {item.is_active ? "Inaktiválás" : "Aktiválás"}
                          </Button>
                          <Link
                            className={buttonClasses({
                              size: "sm",
                              variant: "outline",
                            })}
                            href={`/equipment/${item.id}/edit`}
                          >
                            Szerkesztés
                          </Link>
                          <Button
                            onClick={() => setDeleteTarget(item)}
                            size="sm"
                            variant="ghost"
                          >
                            Törlés
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        description="Az eszköz törlése a munkákhoz kapcsolt hozzárendeléseket is törölheti. Ha már nem használható, inkább inaktiváld."
        isOpen={Boolean(deleteTarget)}
        isWorking={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Biztosan törlöd az eszközt?"
      />
    </div>
  );
}
