"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/calculations";
import { formatTime, getTodayIsoDate } from "@/lib/date";
import { getJobStatusTone, jobStatusLabels, jobStatusOptions } from "@/lib/jobStatus";
import { supabase } from "@/lib/supabaseClient";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchAndFilterBar } from "@/components/ui/SearchAndFilterBar";
import { Select } from "@/components/ui/Select";
import { TextBadge } from "@/components/ui/Badge";
import type {
  EmployeeRow,
  EquipmentRow,
  JobAssignmentRow,
  JobEquipmentRow,
  JobRow,
} from "@/types/database";
import type { JobStatus } from "@/types/job";

type ScheduleGroup = {
  jobs: JobRow[];
  title: string;
};

function getGroupTitle(date: string) {
  const today = getTodayIsoDate();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);
  const weekLimit = new Date();
  weekLimit.setDate(weekLimit.getDate() + 7);
  const weekLimitIso = weekLimit.toISOString().slice(0, 10);

  if (date === today) {
    return "Ma";
  }

  if (date === tomorrowIso) {
    return "Holnap";
  }

  if (date > today && date <= weekLimitIso) {
    return "Ezen a héten";
  }

  if (date > weekLimitIso) {
    return "Később";
  }

  return "Korábbi munkák";
}

export default function CalendarPage() {
  const [assignments, setAssignments] = useState<JobAssignmentRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [jobEquipment, setJobEquipment] = useState<JobEquipmentRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | JobStatus>("all");

  useEffect(() => {
    let isMounted = true;

    async function loadSchedule() {
      const [
        jobsResult,
        assignmentsResult,
        employeesResult,
        jobEquipmentResult,
        equipmentResult,
      ] = await Promise.all([
        supabase.from("jobs").select("*").order("event_date", { ascending: true }),
        supabase.from("job_assignments").select("*"),
        supabase.from("employees").select("*").order("name", { ascending: true }),
        supabase.from("job_equipment").select("*"),
        supabase.from("equipment").select("*").order("name", { ascending: true }),
      ]);

      if (!isMounted) {
        return;
      }

      const firstError =
        jobsResult.error ??
        assignmentsResult.error ??
        employeesResult.error ??
        jobEquipmentResult.error ??
        equipmentResult.error;

      if (firstError) {
        setError(firstError.message);
      } else {
        setJobs(jobsResult.data ?? []);
        setAssignments(assignmentsResult.data ?? []);
        setEmployees(employeesResult.data ?? []);
        setJobEquipment(jobEquipmentResult.data ?? []);
        setEquipment(equipmentResult.data ?? []);
      }

      setIsLoading(false);
    }

    void loadSchedule();

    return () => {
      isMounted = false;
    };
  }, []);

  const groupedJobs = useMemo<ScheduleGroup[]>(() => {
    const term = search.trim().toLowerCase();
    const jobIdsByEmployee = new Set(
      assignments
        .filter(
          (assignment) =>
            employeeFilter === "all" || assignment.employee_id === employeeFilter,
        )
        .map((assignment) => assignment.job_id),
    );
    const jobIdsByEquipment = new Set(
      jobEquipment
        .filter(
          (assignment) =>
            equipmentFilter === "all" || assignment.equipment_id === equipmentFilter,
        )
        .map((assignment) => assignment.job_id),
    );

    const filtered = jobs.filter((job) => {
      const matchesSearch =
        !term ||
        job.title.toLowerCase().includes(term) ||
        job.city?.toLowerCase().includes(term) ||
        job.location_name?.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" || job.status === statusFilter;
      const matchesEmployee =
        employeeFilter === "all" || jobIdsByEmployee.has(job.id);
      const matchesEquipment =
        equipmentFilter === "all" || jobIdsByEquipment.has(job.id);

      return matchesSearch && matchesStatus && matchesEmployee && matchesEquipment;
    });

    const order = ["Ma", "Holnap", "Ezen a héten", "Később", "Korábbi munkák"];
    const groups = filtered.reduce<Record<string, JobRow[]>>((acc, job) => {
      const title = getGroupTitle(job.event_date);
      acc[title] = [...(acc[title] ?? []), job];
      return acc;
    }, {});

    return order
      .map((title) => ({ jobs: groups[title] ?? [], title }))
      .filter((group) => group.jobs.length > 0);
  }, [
    assignments,
    employeeFilter,
    equipmentFilter,
    jobEquipment,
    jobs,
    search,
    statusFilter,
  ]);

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
        description="Időrendbe rendezett ütemezés a közelgő kitelepülésekhez."
        title="Naptár"
      />

      {error ? <ErrorMessage message={error} /> : null}

      <Card>
        <CardHeader>
          <SearchAndFilterBar onSearchChange={setSearch} search={search}>
            <Select
              className="w-full min-w-44"
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
              className="w-full min-w-44"
              onChange={(event) => setEmployeeFilter(event.target.value)}
              value={employeeFilter}
            >
              <option value="all">Minden dolgozó</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </Select>
            <Select
              className="w-full min-w-44"
              onChange={(event) => setEquipmentFilter(event.target.value)}
              value={equipmentFilter}
            >
              <option value="all">Minden eszköz</option>
              {equipment.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </SearchAndFilterBar>
        </CardHeader>
        <CardContent>
          {groupedJobs.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={34} />}
              title="Nincs megjeleníthető munka"
              description="Módosítsd a szűrőket, vagy hozz létre új rendezvényt."
            />
          ) : (
            <div className="grid gap-5">
              {groupedJobs.map((group) => (
                <section className="grid gap-3" key={group.title}>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {group.title}
                  </h2>
                  <div className="grid gap-3">
                    {group.jobs.map((job) => (
                      <Link
                        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition hover:border-teal-200 hover:shadow-md md:grid-cols-[160px_1fr_auto] md:items-center"
                        href={`/jobs/${job.id}`}
                        key={job.id}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {formatDate(job.event_date)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatTime(job.start_time)} - {formatTime(job.end_time)}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-950">
                            {job.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {job.city || "-"} · {job.location_name || "-"}
                          </p>
                        </div>
                        <TextBadge tone={getJobStatusTone(job.status)}>
                          {jobStatusLabels[job.status]}
                        </TextBadge>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
