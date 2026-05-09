"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  AssignmentWithEmployee,
  JobAssignmentsManager,
} from "@/components/jobs/JobAssignmentsManager";
import {
  JobEquipmentManager,
  JobEquipmentWithItem,
} from "@/components/jobs/JobEquipmentManager";
import { CrmAssistantPanel } from "@/components/ai/CrmAssistantPanel";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { TextBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/calculations";
import {
  detectEmployeeConflicts,
  detectEquipmentConflicts,
} from "@/lib/conflicts";
import { formatTime } from "@/lib/date";
import { getJobStatusTone, jobStatusLabels, jobStatusOptions } from "@/lib/jobStatus";
import { supabase } from "@/lib/supabaseClient";
import type {
  ClientRow,
  EmployeeRow,
  EquipmentRow,
  JobAssignmentRow,
  JobEquipmentRow,
  JobRow,
  QuoteRow,
} from "@/types/database";
import type { JobStatus } from "@/types/job";

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [allAssignments, setAllAssignments] = useState<JobAssignmentRow[]>([]);
  const [allJobEquipment, setAllJobEquipment] = useState<JobEquipmentRow[]>([]);
  const [allJobs, setAllJobs] = useState<JobRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithEmployee[]>([]);
  const [client, setClient] = useState<ClientRow | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [job, setJob] = useState<JobRow | null>(null);
  const [jobEquipment, setJobEquipment] = useState<JobEquipmentWithItem[]>([]);
  const [quote, setQuote] = useState<QuoteRow | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const loadRelations = useCallback(async () => {
    const [
      assignmentsResult,
      employeesResult,
      jobEquipmentResult,
      equipmentResult,
      jobsResult,
    ] =
      await Promise.all([
        supabase.from("job_assignments").select("*"),
        supabase.from("employees").select("*").order("name", { ascending: true }),
        supabase.from("job_equipment").select("*"),
        supabase.from("equipment").select("*").order("name", { ascending: true }),
        supabase.from("jobs").select("*"),
      ]);

    if (assignmentsResult.error) {
      setError(assignmentsResult.error.message);
      return;
    }

    if (employeesResult.error) {
      setError(employeesResult.error.message);
      return;
    }

    if (jobEquipmentResult.error) {
      setError(jobEquipmentResult.error.message);
      return;
    }

    if (equipmentResult.error) {
      setError(equipmentResult.error.message);
      return;
    }

    if (jobsResult.error) {
      setError(jobsResult.error.message);
      return;
    }

    const assignmentRows = (assignmentsResult.data ?? []) as JobAssignmentRow[];
    const jobEquipmentRows = (jobEquipmentResult.data ?? []) as JobEquipmentRow[];
    const employeeRows = employeesResult.data ?? [];
    const equipmentRows = equipmentResult.data ?? [];
    const employeeMap = new Map(employeeRows.map((employee) => [employee.id, employee]));
    const equipmentMap = new Map(equipmentRows.map((item) => [item.id, item]));

    setAllAssignments(assignmentRows);
    setAllJobEquipment(jobEquipmentRows);
    setAllJobs(jobsResult.data ?? []);
    setEmployees(employeeRows);
    setEquipment(equipmentRows);
    setAssignments(
      assignmentRows
        .filter((assignment) => assignment.job_id === params.id)
        .map((assignment) => ({
          ...assignment,
          employee: employeeMap.get(assignment.employee_id) ?? null,
        })),
    );
    setJobEquipment(
      jobEquipmentRows
        .filter((assignment) => assignment.job_id === params.id)
        .map((assignment) => ({
          ...assignment,
          equipment: equipmentMap.get(assignment.equipment_id) ?? null,
        })),
    );
  }, [params.id]);

  useEffect(() => {
    let isMounted = true;

    async function loadJob() {
      const jobResult = await supabase
        .from("jobs")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (jobResult.error) {
        setError(jobResult.error.message);
        setIsLoading(false);
        return;
      }

      if (!jobResult.data) {
        setJob(null);
        setIsLoading(false);
        return;
      }

      const loadedJob = jobResult.data;
      setJob(loadedJob);

      const [clientResult, quoteResult] = await Promise.all([
        loadedJob.client_id
          ? supabase
              .from("clients")
              .select("*")
              .eq("id", loadedJob.client_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        loadedJob.quote_id
          ? supabase
              .from("quotes")
              .select("*")
              .eq("id", loadedJob.quote_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (!isMounted) {
        return;
      }

      if (clientResult.error) {
        setError(clientResult.error.message);
      } else {
        setClient(clientResult.data);
      }

      if (quoteResult.error) {
        setError(quoteResult.error.message);
      } else {
        setQuote(quoteResult.data);
      }

      await loadRelations();

      if (isMounted) {
        setIsLoading(false);
      }
    }

    void loadJob();

    return () => {
      isMounted = false;
    };
  }, [loadRelations, params.id]);

  const conflicts = useMemo(() => {
    if (!job) {
      return { employee: [], equipment: [] };
    }

    return {
      employee: detectEmployeeConflicts({
        assignments: allAssignments,
        currentJob: job,
        employees,
        jobs: allJobs,
      }),
      equipment: detectEquipmentConflicts({
        currentJob: job,
        equipment,
        jobEquipment: allJobEquipment,
        jobs: allJobs,
      }),
    };
  }, [allAssignments, allJobEquipment, allJobs, employees, equipment, job]);

  const missingItems = useMemo(() => {
    if (!job) {
      return [];
    }

    return [
      !job.contact_phone ? "kapcsolattartó telefonszám" : null,
      !job.start_time ? "kezdési idő" : null,
      jobEquipment.length === 0 ? "hozzárendelt eszköz" : null,
      assignments.length === 0 ? "beosztott dolgozó" : null,
      !job.address ? "pontos cím" : null,
    ].filter((item): item is string => Boolean(item));
  }, [assignments.length, job, jobEquipment.length]);

  async function handleStatusChange(status: JobStatus) {
    if (!job) {
      return;
    }

    const { error: updateError } = await supabase
      .from("jobs")
      .update({ status })
      .eq("id", job.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setJob({ ...job, status });
  }

  async function handleDelete() {
    if (!job) {
      return;
    }

    setIsDeleting(true);
    const { error: deleteError } = await supabase
      .from("jobs")
      .delete()
      .eq("id", job.id);
    setIsDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.push("/jobs");
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (!job) {
    return (
      <EmptyState
        action={
          <Link className={buttonClasses({})} href="/jobs">
            Vissza a munkákhoz
          </Link>
        }
        title="A munka nem található"
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2">
            <TextBadge tone={getJobStatusTone(job.status)}>
              {jobStatusLabels[job.status]}
            </TextBadge>
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">{job.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(job.event_date)} · {job.city || job.location_name || "-"} ·{" "}
            {formatTime(job.start_time)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className={buttonClasses({ variant: "secondary" })}
            href={`/jobs/${job.id}/sheet`}
          >
            Kitelepülési lap
          </Link>
          <Link
            className={buttonClasses({ variant: "outline" })}
            href={`/jobs/${job.id}/edit`}
          >
            <Pencil size={18} />
            Szerkesztés
          </Link>
          <Button onClick={() => setShowDeleteDialog(true)} variant="danger">
            <Trash2 size={18} />
            Törlés
          </Button>
        </div>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      {conflicts.employee.length || conflicts.equipment.length ? (
        <Card className="border-amber-200 bg-amber-50/70 shadow-amber-100/60">
          <CardContent className="grid gap-3">
            <h2 className="text-base font-semibold text-amber-950">
              Figyelmeztetések
            </h2>
            {[...conflicts.employee, ...conflicts.equipment].map((conflict) => (
              <div
                className="rounded-xl border border-amber-200 bg-white/70 px-3 py-2 text-sm text-amber-900"
                key={`${conflict.name}-${conflict.conflictingJob.id}-${conflict.message}`}
              >
                <strong>{conflict.name}</strong>: {conflict.message} Kapcsolódó
                munka:{" "}
                <Link
                  className="font-semibold underline"
                  href={`/jobs/${conflict.conflictingJob.id}`}
                >
                  {conflict.conflictingJob.title}
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">
                Rendezvény adatai
              </h2>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 md:grid-cols-2">
                <Info label="Rendezvény típusa" value={job.event_type} />
                <Info label="Helyszín neve" value={job.location_name} />
                <Info label="Település" value={job.city} />
                <Info label="Cím" value={job.address} />
                <Info label="Kezdés" value={formatTime(job.start_time)} />
                <Info label="Befejezés" value={formatTime(job.end_time)} />
                <Info
                  label="Várható résztvevők"
                  value={
                    job.expected_participants === null
                      ? null
                      : String(job.expected_participants)
                  }
                />
                <Info label="Vállalási ár" value={formatCurrency(job.price)} />
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500">
                    Státusz
                  </dt>
                  <dd className="mt-1">
                    <Select
                      aria-label="Státusz"
                      onChange={(event) =>
                        handleStatusChange(event.target.value as JobStatus)
                      }
                      value={job.status}
                    >
                      {jobStatusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </Select>
                  </dd>
                </div>
              </dl>
              {job.description ? (
                <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                  {job.description}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <JobAssignmentsManager
            assignments={assignments}
            employees={employees}
            jobId={job.id}
            onChanged={loadRelations}
          />

          <JobEquipmentManager
            equipment={equipment}
            jobEquipment={jobEquipment}
            jobId={job.id}
            onChanged={loadRelations}
          />

          <CrmAssistantPanel
            context={{
              assignments: assignments.map((assignment) => ({
                employee: assignment.employee?.name,
                role: assignment.assignment_role,
              })),
              equipment: jobEquipment.map((assignment) => ({
                equipment: assignment.equipment?.name,
                quantity: assignment.quantity,
              })),
              job,
            }}
            missingItems={missingItems}
            mode="job"
            title="AI összefoglaló"
          />
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">
                Kapcsolatok
              </h2>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <Info
                label="Ügyfél / szervező"
                value={client?.company_name || client?.name || "Nincs kapcsolt ügyfél"}
              />
              <Info label="Kapcsolattartó" value={job.contact_name} />
              <Info label="Kapcsolattartó telefon" value={job.contact_phone} />
              <Info label="Kapcsolattartó email" value={job.contact_email} />
              {quote ? (
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500">
                    Kapcsolódó árajánlat
                  </dt>
                  <dd className="mt-1">
                    <Link className="font-semibold text-teal-700" href={`/quotes/${quote.id}`}>
                      {quote.quote_number} - {quote.title}
                    </Link>
                  </dd>
                </div>
              ) : (
                <Info label="Kapcsolódó árajánlat" value={null} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">
                Belső információk
              </h2>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">
              {job.internal_notes || "Nincs belső megjegyzés."}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        description="A munka törlése a hozzá tartozó dolgozó- és eszközhozzárendeléseket is törli."
        isOpen={showDeleteDialog}
        isWorking={isDeleting}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Biztosan törlöd a munkát?"
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
