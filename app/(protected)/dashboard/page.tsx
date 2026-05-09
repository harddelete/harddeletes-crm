"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/calculations";
import {
  detectEmployeeConflicts,
  detectEquipmentConflicts,
} from "@/lib/conflicts";
import { formatTime, getTodayIsoDate } from "@/lib/date";
import { getJobStatusTone, jobStatusLabels, jobStatusOptions } from "@/lib/jobStatus";
import { supabase } from "@/lib/supabaseClient";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TextBadge } from "@/components/ui/Badge";
import { Table, TBody, Td, THead, Th, Tr } from "@/components/ui/Table";
import type {
  ClientRow,
  EmployeeRow,
  EquipmentRow,
  JobAssignmentRow,
  JobEquipmentRow,
  JobRow,
} from "@/types/database";
import type { JobStatus } from "@/types/job";

const emptyStatusCounts: Record<JobStatus, number> = {
  cancelled: 0,
  completed: 0,
  confirmed: 0,
  in_progress: 0,
  inquiry: 0,
  invoiced: 0,
  paid: 0,
  quoted: 0,
  scheduled: 0,
};

export default function DashboardPage() {
  const [assignments, setAssignments] = useState<JobAssignmentRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [jobEquipment, setJobEquipment] = useState<JobEquipmentRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const [
        clientsResult,
        employeesResult,
        equipmentResult,
        jobsResult,
        assignmentsResult,
        jobEquipmentResult,
      ] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("employees").select("*"),
        supabase.from("equipment").select("*"),
        supabase.from("jobs").select("*").order("event_date", { ascending: true }),
        supabase.from("job_assignments").select("*"),
        supabase.from("job_equipment").select("*"),
      ]);

      if (!isMounted) {
        return;
      }

      const firstError =
        clientsResult.error ??
        employeesResult.error ??
        equipmentResult.error ??
        jobsResult.error ??
        assignmentsResult.error ??
        jobEquipmentResult.error;

      if (firstError) {
        setError(firstError.message);
      } else {
        setClients(clientsResult.data ?? []);
        setEmployees(employeesResult.data ?? []);
        setEquipment(equipmentResult.data ?? []);
        setJobs(jobsResult.data ?? []);
        setAssignments(assignmentsResult.data ?? []);
        setJobEquipment(jobEquipmentResult.data ?? []);
      }

      setIsLoading(false);
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const today = getTodayIsoDate();
    const statusCounts = jobs.reduce<Record<JobStatus, number>>(
      (counts, job) => ({
        ...counts,
        [job.status]: counts[job.status] + 1,
      }),
      { ...emptyStatusCounts },
    );
    const assignmentCounts = assignments.reduce<Record<string, number>>(
      (counts, assignment) => ({
        ...counts,
        [assignment.job_id]: (counts[assignment.job_id] ?? 0) + 1,
      }),
      {},
    );
    const upcomingJobs = jobs
      .filter((job) => job.event_date >= today && job.status !== "cancelled")
      .slice(0, 5);

    return {
      activeEmployees: employees.filter((employee) => employee.is_active).length,
      activeEquipment: equipment.filter((item) => item.is_active).length,
      assignmentCounts,
      completedJobs: statusCounts.completed,
      confirmedJobs: statusCounts.confirmed,
      paidRevenue: jobs
        .filter((job) => job.status === "paid")
        .reduce((sum, job) => sum + job.price, 0),
      statusCounts,
      todayJobs: jobs.filter((job) => job.event_date === today).length,
      upcomingJobs,
      upcomingJobsCount: jobs.filter(
        (job) => job.event_date >= today && job.status !== "cancelled",
      ).length,
    };
  }, [assignments, employees, equipment, jobs]);

  const warningItems = useMemo(() => {
    const upcoming = metrics.upcomingJobs;
    const items = upcoming.flatMap((job) => [
      ...detectEmployeeConflicts({
        assignments,
        currentJob: job,
        employees,
        jobs,
      }),
      ...detectEquipmentConflicts({
        currentJob: job,
        equipment,
        jobEquipment,
        jobs,
      }),
    ]);

    return items.slice(0, 5);
  }, [assignments, employees, equipment, jobEquipment, jobs, metrics.upcomingJobs]);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        actions={
          <Link className={buttonClasses({})} href="/jobs/new">
            Új munka
          </Link>
        }
        description="Céges áttekintő a közelgő rendezvényekről, dolgozókról és eszközökről."
        title="Dashboard"
      />

      {error ? <ErrorMessage message={error} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Users size={20} />}
          label="Összes ügyfél"
          value={String(clients.length)}
        />
        <MetricCard
          icon={<Users size={20} />}
          label="Aktív dolgozók"
          value={String(metrics.activeEmployees)}
        />
        <MetricCard
          icon={<Package size={20} />}
          label="Aktív eszközök"
          value={String(metrics.activeEquipment)}
        />
        <MetricCard
          icon={<CalendarDays size={20} />}
          label="Közelgő munkák"
          value={String(metrics.upcomingJobsCount)}
        />
        <MetricCard
          icon={<BriefcaseBusiness size={20} />}
          label="Mai munkák"
          value={String(metrics.todayJobs)}
        />
        <MetricCard
          icon={<BriefcaseBusiness size={20} />}
          label="Visszaigazolt munkák"
          value={String(metrics.confirmedJobs)}
        />
        <MetricCard
          icon={<BriefcaseBusiness size={20} />}
          label="Befejezett munkák"
          value={String(metrics.completedJobs)}
        />
        <MetricCard
          icon={<TrendingUp size={20} />}
          label="Fizetett munkák értéke"
          value={formatCurrency(metrics.paidRevenue)}
        />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">
            Rendszer áttekintés
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              "Ügyfélkezelés",
              "Munkaszervezés",
              "Dolgozói beosztás",
              "Eszközkezelés",
              "Naptár",
              "Ütközésfigyelés",
              "Kitelepülési lap",
              "Árajánlatok",
            ].map((feature) => (
              <div
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                key={feature}
              >
                {feature}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-950">
              Közelgő munkák
            </h2>
            <Link className="text-sm font-medium text-teal-700" href="/jobs">
              Összes munka
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {metrics.upcomingJobs.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  action={
                    <Link className={buttonClasses({})} href="/jobs/new">
                      Hozd létre az első rendezvényt
                    </Link>
                  }
                  icon={<BriefcaseBusiness size={34} />}
                  title="Még nincs létrehozott munka"
                />
              </div>
            ) : (
              <Table>
                <THead>
                  <Tr>
                    <Th>Rendezvény</Th>
                    <Th>Dátum</Th>
                    <Th>Település</Th>
                    <Th>Kezdés</Th>
                    <Th>Státusz</Th>
                    <Th>Dolgozók</Th>
                  </Tr>
                </THead>
                <TBody>
                  {metrics.upcomingJobs.map((job) => (
                    <Tr key={job.id}>
                      <Td>
                        <Link
                          className="font-semibold text-teal-700"
                          href={`/jobs/${job.id}`}
                        >
                          {job.title}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {job.location_name || "-"}
                        </div>
                      </Td>
                      <Td>{formatDate(job.event_date)}</Td>
                      <Td>{job.city || "-"}</Td>
                      <Td>{formatTime(job.start_time)}</Td>
                      <Td>
                        <TextBadge tone={getJobStatusTone(job.status)}>
                          {jobStatusLabels[job.status]}
                        </TextBadge>
                      </Td>
                      <Td>{metrics.assignmentCounts[job.id] ?? 0}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">
                Figyelmeztetések
              </h2>
            </CardHeader>
            <CardContent className="grid gap-3">
              {warningItems.length === 0 ? (
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  Nincs ismert dolgozói vagy eszközütközés a közelgő munkákban.
                </p>
              ) : (
                warningItems.map((warning) => (
                  <Link
                    className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 transition hover:bg-amber-100"
                    href={`/jobs/${warning.conflictingJob.id}`}
                    key={`${warning.name}-${warning.conflictingJob.id}-${warning.message}`}
                  >
                    <strong>{warning.name}</strong>: {warning.message}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">
                Munka státuszok
              </h2>
            </CardHeader>
            <CardContent className="grid gap-3">
              {jobStatusOptions.map((status) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                  key={status.value}
                >
                  <span className="text-sm text-slate-600">{status.label}</span>
                  <strong className="text-sm text-slate-950">
                    {metrics.statusCounts[status.value]}
                  </strong>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
