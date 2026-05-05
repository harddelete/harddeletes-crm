"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { employmentTypeLabels } from "@/lib/employee";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { TextBadge } from "@/components/ui/Badge";
import { Table, TBody, Td, THead, Th, Tr } from "@/components/ui/Table";
import type { EmployeeRow } from "@/types/database";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRow | null>(null);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadEmployees() {
      const { data, error: loadError } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (loadError) {
        setError(loadError.message);
      } else {
        setEmployees(data ?? []);
      }

      setIsLoading(false);
    }

    void loadEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return employees;
    }

    return employees.filter((employee) =>
      [
        employee.name,
        employee.email,
        employee.phone,
        employee.job_title,
        employee.position,
      ].some((value) => value?.toLowerCase().includes(term)),
    );
  }, [employees, search]);

  async function toggleActive(employee: EmployeeRow) {
    const nextValue = !employee.is_active;
    const { error: updateError } = await supabase
      .from("employees")
      .update({ is_active: nextValue })
      .eq("id", employee.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEmployees((current) =>
      current.map((item) =>
        item.id === employee.id ? { ...item, is_active: nextValue } : item,
      ),
    );
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    const { error: deleteError } = await supabase
      .from("employees")
      .delete()
      .eq("id", deleteTarget.id);
    setIsDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setEmployees((current) =>
      current.filter((employee) => employee.id !== deleteTarget.id),
    );
    setDeleteTarget(null);
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Dolgozók</h1>
          <p className="mt-1 text-sm text-slate-500">
            Munkatársak, szerepkörök és kitelepülési beosztások kezelése.
          </p>
        </div>
        <Link className={buttonClasses({})} href="/employees/new">
          <Plus size={18} />
          Új dolgozó
        </Link>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      {employees.length === 0 ? (
        <EmptyState
          action={
            <Link className={buttonClasses({})} href="/employees/new">
              Vedd fel az első dolgozót
            </Link>
          }
          description="A dolgozókat később munkákhoz tudod beosztani."
          icon={<Users size={36} />}
          title="Még nincs dolgozó"
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
                placeholder="Keresés név, telefon, email vagy pozíció alapján"
                value={search}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredEmployees.length === 0 ? (
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
                    <Th>Munkakör</Th>
                    <Th>Telefon</Th>
                    <Th>Foglalkoztatás</Th>
                    <Th>Óradíj</Th>
                    <Th>Státusz</Th>
                    <Th>Létrehozva</Th>
                    <Th className="text-right">Műveletek</Th>
                  </Tr>
                </THead>
                <TBody>
                  {filteredEmployees.map((employee) => (
                    <Tr key={employee.id}>
                      <Td>
                        <Link
                          className="font-semibold text-teal-700"
                          href={`/employees/${employee.id}`}
                        >
                          {employee.name}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {employee.email || "-"}
                        </div>
                      </Td>
                      <Td>{employee.job_title || employee.position || "-"}</Td>
                      <Td>{employee.phone || "-"}</Td>
                      <Td>{employmentTypeLabels[employee.employment_type]}</Td>
                      <Td>{formatCurrency(employee.hourly_rate)}</Td>
                      <Td>
                        <TextBadge tone={employee.is_active ? "emerald" : "slate"}>
                          {employee.is_active ? "Aktív" : "Inaktív"}
                        </TextBadge>
                      </Td>
                      <Td>{formatDate(employee.created_at)}</Td>
                      <Td>
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => toggleActive(employee)}
                            size="sm"
                            variant="outline"
                          >
                            {employee.is_active ? "Inaktiválás" : "Aktiválás"}
                          </Button>
                          <Link
                            className={buttonClasses({
                              size: "sm",
                              variant: "outline",
                            })}
                            href={`/employees/${employee.id}/edit`}
                          >
                            Szerkesztés
                          </Link>
                          <Button
                            onClick={() => setDeleteTarget(employee)}
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
        description="A dolgozó törlése a kapcsolódó beosztásokat is törölheti. Ha csak már nem dolgozik aktívan, inkább inaktiváld."
        isOpen={Boolean(deleteTarget)}
        isWorking={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Biztosan törlöd a dolgozót?"
      />
    </div>
  );
}
