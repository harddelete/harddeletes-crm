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
import { formatTime, getTodayIsoDate } from "@/lib/date";
import { getJobStatusTone, jobStatusLabels, jobStatusOptions } from "@/lib/jobStatus";
import { supabase } from "@/lib/supabaseClient";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { TextBadge } from "@/components/ui/Badge";
import { Table, TBody, Td, THead, Th, Tr } from "@/components/ui/Table";
import type {
  ClientRow,
  EmployeeRow,
  EquipmentRow,
  JobAssignmentRow,
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
      ] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("employees").select("*"),
        supabase.from("equipment").select("*"),
        supabase.from("jobs").select("*").order("event_date", { ascending: true }),
        supabase.from("job_assignments").select("*"),
      ]);

      if (!isMounted) {
        return;
      }

      const firstError =
        clientsResult.error ??
        employeesResult.error ??
        equipmentResult.error ??
        jobsResult.error ??
        assignmentsResult.error;

      if (firstError) {
        setError(firstError.message);
      } else {
        setClients(clientsResult.data ?? []);
        setEmployees(employeesResult.data ?? []);
        setEquipment(equipmentResult.data ?? []);
        setJobs(jobsResult.data ?? []);
        setAssignments(assignmentsResult.data ?? []);
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

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Céges áttekintő a közelgő rendezvényekről, dolgozókról és eszközökről.
          </p>
        </div>
        <Link className={buttonClasses({})} href="/jobs/new">
          Új munka
        </Link>
      </div>

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

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
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
