"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatDate } from "@/lib/calculations";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TBody, Td, THead, Th, Tr } from "@/components/ui/Table";
import type { ClientRow } from "@/types/database";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ClientRow | null>(null);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadClients() {
      const { data, error: loadError } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (loadError) {
        setError(loadError.message);
      } else {
        setClients(data ?? []);
      }

      setIsLoading(false);
    }

    void loadClients();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return clients;
    }

    return clients.filter((client) =>
      [client.name, client.company_name, client.email].some((value) =>
        value?.toLowerCase().includes(term),
      ),
    );
  }, [clients, search]);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    const { error: deleteError } = await supabase
      .from("clients")
      .delete()
      .eq("id", deleteTarget.id);

    setIsDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setDeleteTarget(null);
    setClients((current) =>
      current.filter((client) => client.id !== deleteTarget.id),
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Ügyfelek</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ügyféladatok, céges információk és elérhetőségek egy helyen.
          </p>
        </div>
        <Link className={buttonClasses({})} href="/clients/new">
          <Plus size={18} />
          Új ügyfél
        </Link>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      {clients.length === 0 ? (
        <EmptyState
          action={
            <Link className={buttonClasses({})} href="/clients/new">
              Hozd létre az első ügyfelet
            </Link>
          }
          description="Az ügyfelekhez később árajánlatokat tudsz kapcsolni."
          icon={<Users size={36} />}
          title="Még nincs ügyfeled"
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
            {filteredClients.length === 0 ? (
              <div className="p-5">
                <EmptyState title="Nincs találat" description="Próbálj más keresési kifejezést." />
              </div>
            ) : (
              <Table>
                <THead>
                  <Tr>
                    <Th>Név</Th>
                    <Th>Cég</Th>
                    <Th>Email</Th>
                    <Th>Telefon</Th>
                    <Th>Létrehozva</Th>
                    <Th className="text-right">Műveletek</Th>
                  </Tr>
                </THead>
                <TBody>
                  {filteredClients.map((client) => (
                    <Tr key={client.id}>
                      <Td>
                        <Link
                          className="font-semibold text-teal-700"
                          href={`/clients/${client.id}`}
                        >
                          {client.name}
                        </Link>
                      </Td>
                      <Td>{client.company_name || "-"}</Td>
                      <Td>{client.email || "-"}</Td>
                      <Td>{client.phone || "-"}</Td>
                      <Td>{formatDate(client.created_at)}</Td>
                      <Td>
                        <div className="flex justify-end gap-2">
                          <Link
                            className={buttonClasses({
                              size: "sm",
                              variant: "outline",
                            })}
                            href={`/clients/${client.id}/edit`}
                          >
                            Szerkesztés
                          </Link>
                          <Button
                            onClick={() => setDeleteTarget(client)}
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
        description="Az ügyfél törlése után az adatai nem állíthatók vissza."
        isOpen={Boolean(deleteTarget)}
        isWorking={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Biztosan törlöd az ügyfelet?"
      />
    </div>
  );
}
