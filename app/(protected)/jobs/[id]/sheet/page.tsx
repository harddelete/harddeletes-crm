"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { buttonClasses, Button } from "@/components/ui/Button";
import { DetailRow } from "@/components/ui/DetailRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { TextBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { formatTime } from "@/lib/date";
import { getJobStatusTone, jobStatusLabels } from "@/lib/jobStatus";
import { supabase } from "@/lib/supabaseClient";
import type {
  ClientRow,
  EmployeeRow,
  EquipmentRow,
  JobAssignmentRow,
  JobEquipmentRow,
  JobRow,
} from "@/types/database";

type AssignmentWithEmployee = JobAssignmentRow & {
  employee: EmployeeRow | null;
};

type EquipmentWithItem = JobEquipmentRow & {
  equipment: EquipmentRow | null;
};

export default function JobSheetPage() {
  const params = useParams<{ id: string }>();
  const [assignments, setAssignments] = useState<AssignmentWithEmployee[]>([]);
  const [client, setClient] = useState<ClientRow | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [job, setJob] = useState<JobRow | null>(null);
  const [jobEquipment, setJobEquipment] = useState<EquipmentWithItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadSheet() {
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

      const [
        clientResult,
        assignmentsResult,
        employeesResult,
        jobEquipmentResult,
        equipmentResult,
      ] = await Promise.all([
        loadedJob.client_id
          ? supabase.from("clients").select("*").eq("id", loadedJob.client_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from("job_assignments").select("*").eq("job_id", loadedJob.id),
        supabase.from("employees").select("*"),
        supabase.from("job_equipment").select("*").eq("job_id", loadedJob.id),
        supabase.from("equipment").select("*"),
      ]);

      if (!isMounted) {
        return;
      }

      const firstError =
        clientResult.error ??
        assignmentsResult.error ??
        employeesResult.error ??
        jobEquipmentResult.error ??
        equipmentResult.error;

      if (firstError) {
        setError(firstError.message);
      } else {
        const employees = employeesResult.data ?? [];
        const equipment = equipmentResult.data ?? [];
        const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));
        const equipmentMap = new Map(equipment.map((item) => [item.id, item]));

        setClient(clientResult.data);
        setAssignments(
          (assignmentsResult.data ?? []).map((assignment) => ({
            ...assignment,
            employee: employeeMap.get(assignment.employee_id) ?? null,
          })),
        );
        setJobEquipment(
          (jobEquipmentResult.data ?? []).map((assignment) => ({
            ...assignment,
            equipment: equipmentMap.get(assignment.equipment_id) ?? null,
          })),
        );
      }

      setIsLoading(false);
    }

    void loadSheet();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!job) {
    return <EmptyState title="A munka nem található" />;
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 print:max-w-none print:bg-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Link className={buttonClasses({ variant: "outline" })} href={`/jobs/${job.id}`}>
          Vissza a munkához
        </Link>
        <Button onClick={() => window.print()} variant="secondary">
          <Printer size={18} />
          Nyomtatás
        </Button>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Kitelepülési lap
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              {job.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {formatDate(job.event_date)} · {formatTime(job.start_time)} -{" "}
              {formatTime(job.end_time)}
            </p>
          </div>
          <TextBadge tone={getJobStatusTone(job.status)}>
            {jobStatusLabels[job.status]}
          </TextBadge>
        </header>

        <section className="grid gap-6 py-6 md:grid-cols-2">
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-950">Helyszín</h2>
            <dl className="grid gap-3">
              <DetailRow label="Helyszín neve" value={job.location_name} />
              <DetailRow label="Település" value={job.city} />
              <DetailRow label="Cím" value={job.address} />
              <DetailRow label="Rendezvény típusa" value={job.event_type} />
            </dl>
          </div>
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-950">Kapcsolatok</h2>
            <dl className="grid gap-3">
              <DetailRow
                label="Ügyfél"
                value={client?.company_name || client?.name}
              />
              <DetailRow label="Kapcsolattartó" value={job.contact_name} />
              <DetailRow label="Telefon" value={job.contact_phone} />
              <DetailRow label="Vállalási ár" value={formatCurrency(job.price)} />
            </dl>
          </div>
        </section>

        <section className="grid gap-6 border-t border-slate-200 py-6 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-950">
              Beosztott dolgozók
            </h2>
            <div className="grid gap-2">
              {assignments.length === 0 ? (
                <p className="text-sm text-slate-500">Nincs beosztott dolgozó.</p>
              ) : (
                assignments.map((assignment) => (
                  <div
                    className="rounded-xl border border-slate-200 p-3 text-sm"
                    key={assignment.id}
                  >
                    <strong>{assignment.employee?.name || "Törölt dolgozó"}</strong>
                    <p className="mt-1 text-slate-600">
                      {assignment.assignment_role || "-"} ·{" "}
                      {formatTime(assignment.planned_start_time)} -{" "}
                      {formatTime(assignment.planned_end_time)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-950">
              Hozzárendelt eszközök
            </h2>
            <div className="grid gap-2">
              {jobEquipment.length === 0 ? (
                <p className="text-sm text-slate-500">Nincs hozzárendelt eszköz.</p>
              ) : (
                jobEquipment.map((assignment) => (
                  <div
                    className="rounded-xl border border-slate-200 p-3 text-sm"
                    key={assignment.id}
                  >
                    <strong>{assignment.equipment?.name || "Törölt eszköz"}</strong>
                    <p className="mt-1 text-slate-600">
                      Mennyiség: {assignment.quantity}
                      {assignment.notes ? ` · ${assignment.notes}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-950">Megjegyzések</h2>
          <div className="rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
            {job.internal_notes || "Nincs belső megjegyzés."}
          </div>
          <div className="grid gap-2 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            <strong>Indulási / pakolási megjegyzés</strong>
            <div className="min-h-20" />
          </div>
        </section>
      </article>
    </div>
  );
}
