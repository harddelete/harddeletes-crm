"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Plus, Search } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { formatTime, getTodayIsoDate } from "@/lib/date";
import { jobStatusOptions } from "@/lib/jobStatus";
import { supabase } from "@/lib/supabaseClient";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Table, TBody, Td, THead, Th, Tr } from "@/components/ui/Table";
import type { ClientRow, JobAssignmentRow, JobRow } from "@/types/database";
import type { JobStatus } from "@/types/job";

type JobWithClient = JobRow & {
  assignmentCount: number;
  clientName: string;
};

type DateFilter = "all" | "today" | "upcoming" | "past";

export default function JobsPage() {
  const [assignments, setAssignments] = useState<JobAssignmentRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<JobRow | null>(null);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("upcoming");
  const [statusFilter, setStatusFilter] = useState<"all" | JobStatus>("all");

  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      const [jobsResult, clientsResult, assignmentsResult] = await Promise.all([
        supabase.from("jobs").select("*").order("event_date", { ascending: true }),
        supabase.from("clients").select("*"),
        supabase.from("job_assignments").select("*"),
      ]);

      if (!isMounted) {
        return;
      }

      if (jobsResult.error) {
        setError(jobsResult.error.message);
      } else {
        setJobs(jobsResult.data ?? []);
      }

      if (clientsResult.error) {
        setError(clientsResult.error.message);
      } else {
        setClients(clientsResult.data ?? []);
      }

      if (assignmentsResult.error) {
        setError(assignmentsResult.error.message);
      } else {
        setAssignments(assignmentsResult.data ?? []);
      }

      setIsLoading(false);
    }

    void loadJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredJobs = useMemo<JobWithClient[]>(() => {
    const clientMap = new Map(
      clients.map((client) => [client.id, client.company_name || client.name]),
    );
    const assignmentCounts = assignments.reduce<Record<string, number>>(
      (counts, assignment) => ({
        ...counts,
        [assignment.job_id]: (counts[assignment.job_id] ?? 0) + 1,
      }),
      {},
    );
    const term = search.trim().toLowerCase();
    const today = getTodayIsoDate();

    return jobs
      .map((job) => ({
        ...job,
        assignmentCount: assignmentCounts[job.id] ?? 0,
        clientName: job.client_id
          ? clientMap.get(job.client_id) ?? "Törölt ügyfél"
          : "Nincs ügyfél",
      }))
      .filter((job) => {
        const matchesSearch =
          !term ||
          job.title.toLowerCase().includes(term) ||
          job.location_name?.toLowerCase().includes(term) ||
          job.city?.toLowerCase().includes(term) ||
          job.clientName.toLowerCase().includes(term);
        const matchesStatus =
          statusFilter === "all" || job.status === statusFilter;
        const matchesDate =
          dateFilter === "all" ||
          (dateFilter === "today" && job.event_date === today) ||
          (dateFilter === "upcoming" && job.event_date >= today) ||
          (dateFilter === "past" && job.event_date < today);

        return matchesSearch && matchesStatus && matchesDate;
      });
  }, [assignments, clients, dateFilter, jobs, search, statusFilter]);

  async function handleStatusChange(job: JobRow, status: JobStatus) {
    const { error: updateError } = await supabase
      .from("jobs")
      .update({ status })
      .eq("id", job.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setJobs((current) =>
      current.map((item) => (item.id === job.id ? { ...item, status } : item)),
    );
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    const { error: deleteError } = await supabase
      .from("jobs")
      .delete()
      .eq("id", deleteTarget.id);
    setIsDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setJobs((current) => current.filter((job) => job.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        actions={
          <Link className={buttonClasses({})} href="/jobs/new">
            <Plus size={18} />
            Új munka
          </Link>
        }
        description="Rendezvények, kitelepülések és beosztások kezelése."
        title="Munkák"
      />

      {error ? <ErrorMessage message={error} /> : null}

      {jobs.length === 0 ? (
        <EmptyState
          action={
            <Link className={buttonClasses({})} href="/jobs/new">
              Hozd létre az első rendezvényt
            </Link>
          }
          description="Itt kezelheted a konkrét kitelepüléseket és beosztásokat."
          icon={<BriefcaseBusiness size={36} />}
          title="Még nincs létrehozott munka"
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
              <div className="relative">
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
              <Select
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | JobStatus)
                }
                value={statusFilter}
              >
                <option value="all">Minden státusz</option>
                {jobStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
              <Select
                onChange={(event) => setDateFilter(event.target.value as DateFilter)}
                value={dateFilter}
              >
                <option value="upcoming">Közelgő munkák</option>
                <option value="today">Mai munkák</option>
                <option value="past">Korábbi munkák</option>
                <option value="all">Összes dátum</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredJobs.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  description="Módosítsd a keresést vagy a szűrőket."
                  title="Nincs találat"
                />
              </div>
            ) : (
              <Table>
                <THead>
                  <Tr>
                    <Th>Munka</Th>
                    <Th>Dátum</Th>
                    <Th>Település</Th>
                    <Th>Ügyfél</Th>
                    <Th>Státusz</Th>
                    <Th>Dolgozók</Th>
                    <Th className="text-right">Ár</Th>
                    <Th className="text-right">Műveletek</Th>
                  </Tr>
                </THead>
                <TBody>
                  {filteredJobs.map((job) => (
                    <Tr key={job.id}>
                      <Td>
                        <Link
                          className="font-semibold text-teal-700"
                          href={`/jobs/${job.id}`}
                        >
                          {job.title}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {job.location_name || "-"} · {formatTime(job.start_time)}
                        </div>
                      </Td>
                      <Td>{formatDate(job.event_date)}</Td>
                      <Td>{job.city || "-"}</Td>
                      <Td>{job.clientName}</Td>
                      <Td>
                        <Select
                          aria-label="Státusz"
                          className="h-9 min-w-40"
                          onChange={(event) =>
                            handleStatusChange(job, event.target.value as JobStatus)
                          }
                          value={job.status}
                        >
                          {jobStatusOptions.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </Select>
                      </Td>
                      <Td>{job.assignmentCount}</Td>
                      <Td className="text-right font-semibold text-slate-950">
                        {formatCurrency(job.price)}
                      </Td>
                      <Td>
                        <div className="flex justify-end gap-2">
                          <Link
                            className={buttonClasses({
                              size: "sm",
                              variant: "outline",
                            })}
                            href={`/jobs/${job.id}/edit`}
                          >
                            Szerkesztés
                          </Link>
                          <Button
                            onClick={() => setDeleteTarget(job)}
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
        description="A munka törlése a hozzá tartozó dolgozó- és eszközhozzárendeléseket is törli."
        isOpen={Boolean(deleteTarget)}
        isWorking={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Biztosan törlöd a munkát?"
      />
    </div>
  );
}
