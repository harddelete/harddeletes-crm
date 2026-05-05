"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness } from "lucide-react";
import { employmentTypeLabels } from "@/lib/employee";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { formatTime } from "@/lib/date";
import { jobStatusLabels, getJobStatusTone } from "@/lib/jobStatus";
import { supabase } from "@/lib/supabaseClient";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { TextBadge } from "@/components/ui/Badge";
import { Table, TBody, Td, THead, Th, Tr } from "@/components/ui/Table";
import type { EmployeeRow, JobAssignmentRow, JobRow } from "@/types/database";

type AssignmentWithJob = JobAssignmentRow & {
  job: JobRow | null;
};

export default function EmployeeDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentWithJob[]>([]);
  const [employee, setEmployee] = useState<EmployeeRow | null>(null);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployee() {
      const employeeResult = await supabase
        .from("employees")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();

      const assignmentsResult = await supabase
        .from("job_assignments")
        .select("*")
        .eq("employee_id", params.id)
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (employeeResult.error) {
        setError(employeeResult.error.message);
        setIsLoading(false);
        return;
      }

      setEmployee(employeeResult.data);

      if (assignmentsResult.error) {
        setError(assignmentsResult.error.message);
        setIsLoading(false);
        return;
      }

      const assignmentRows = assignmentsResult.data ?? [];
      const jobIds = assignmentRows.map((assignment) => assignment.job_id);

      if (jobIds.length === 0) {
        setAssignments([]);
        setIsLoading(false);
        return;
      }

      const jobsResult = await supabase.from("jobs").select("*").in("id", jobIds);

      if (!isMounted) {
        return;
      }

      if (jobsResult.error) {
        setError(jobsResult.error.message);
      } else {
        const jobMap = new Map((jobsResult.data ?? []).map((job) => [job.id, job]));
        setAssignments(
          assignmentRows.map((assignment) => ({
            ...assignment,
            job: jobMap.get(assignment.job_id) ?? null,
          })),
        );
      }

      setIsLoading(false);
    }

    void loadEmployee();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const upcomingAssignments = useMemo(
    () =>
      assignments
        .filter((assignment) => assignment.job)
        .sort((left, right) => {
          const leftDate = left.job?.event_date ?? "";
          const rightDate = right.job?.event_date ?? "";
          return leftDate.localeCompare(rightDate);
        }),
    [assignments],
  );

  async function handleDelete() {
    if (!employee) {
      return;
    }

    setIsDeleting(true);
    const { error: deleteError } = await supabase
      .from("employees")
      .delete()
      .eq("id", employee.id);
    setIsDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.push("/employees");
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (!employee) {
    return <EmptyState title="A dolgozó nem található" />;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2">
            <TextBadge tone={employee.is_active ? "emerald" : "slate"}>
              {employee.is_active ? "Aktív" : "Inaktív"}
            </TextBadge>
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">
            {employee.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {employee.job_title || employee.position || "Nincs megadott munkakör"}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className={buttonClasses({ variant: "outline" })}
            href={`/employees/${employee.id}/edit`}
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
            Dolgozó adatai
          </h2>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <Info label="Email" value={employee.email} />
            <Info label="Telefonszám" value={employee.phone} />
            <Info label="Munkakör" value={employee.job_title} />
            <Info label="Pozíció / szerepkör" value={employee.position} />
            <Info
              label="Foglalkoztatás típusa"
              value={employmentTypeLabels[employee.employment_type]}
            />
            <Info label="Óradíj" value={formatCurrency(employee.hourly_rate)} />
          </dl>
          {employee.notes ? (
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
              {employee.notes}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">
            Beosztott munkák
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          {upcomingAssignments.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<BriefcaseBusiness size={32} />}
                title="Nincs beosztott munka"
              />
            </div>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Munka</Th>
                  <Th>Dátum</Th>
                  <Th>Helyszín</Th>
                  <Th>Szerep</Th>
                  <Th>Idő</Th>
                  <Th>Státusz</Th>
                </Tr>
              </THead>
              <TBody>
                {upcomingAssignments.map((assignment) => {
                  const job = assignment.job;
                  if (!job) {
                    return null;
                  }

                  return (
                    <Tr key={assignment.id}>
                      <Td>
                        <Link
                          className="font-semibold text-teal-700"
                          href={`/jobs/${job.id}`}
                        >
                          {job.title}
                        </Link>
                      </Td>
                      <Td>{formatDate(job.event_date)}</Td>
                      <Td>{job.city || job.location_name || "-"}</Td>
                      <Td>{assignment.assignment_role || "-"}</Td>
                      <Td>
                        {formatTime(assignment.planned_start_time)} -{" "}
                        {formatTime(assignment.planned_end_time)}
                      </Td>
                      <Td>
                        <TextBadge tone={getJobStatusTone(job.status)}>
                          {jobStatusLabels[job.status]}
                        </TextBadge>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        description="A dolgozó törlése a kapcsolódó beosztásokat is törölheti."
        isOpen={showDeleteDialog}
        isWorking={isDeleting}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Biztosan törlöd a dolgozót?"
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
