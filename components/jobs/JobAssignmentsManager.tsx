"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TBody, Td, THead, Th, Tr } from "@/components/ui/Table";
import { formatTime } from "@/lib/date";
import { supabase } from "@/lib/supabaseClient";
import { emptyToNull } from "@/lib/utils";
import type { EmployeeRow, JobAssignmentRow } from "@/types/database";
import type { JobAssignmentFormValues } from "@/types/job";

export type AssignmentWithEmployee = JobAssignmentRow & {
  employee: EmployeeRow | null;
};

const emptyAssignmentForm: JobAssignmentFormValues = {
  assignment_role: "",
  employee_id: "",
  notes: "",
  planned_end_time: "",
  planned_start_time: "",
};

type JobAssignmentsManagerProps = {
  assignments: AssignmentWithEmployee[];
  employees: EmployeeRow[];
  jobId: string;
  onChanged: () => Promise<void>;
};

export function JobAssignmentsManager({
  assignments,
  employees,
  jobId,
  onChanged,
}: JobAssignmentsManagerProps) {
  const { user } = useAuth();
  const [values, setValues] =
    useState<JobAssignmentFormValues>(emptyAssignmentForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof JobAssignmentFormValues>(
    field: K,
    value: JobAssignmentFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!user) {
      setError("A mentéshez be kell jelentkezni.");
      return;
    }

    if (!values.employee_id) {
      setError("Válassz dolgozót.");
      return;
    }

    if (
      values.planned_start_time &&
      values.planned_end_time &&
      values.planned_end_time < values.planned_start_time
    ) {
      setError("A tervezett befejezés nem lehet korábbi, mint a kezdés.");
      return;
    }

    setIsSubmitting(true);

    const { error: insertError } = await supabase
      .from("job_assignments")
      .insert({
        actual_end_time: null,
        actual_start_time: null,
        assignment_role: emptyToNull(values.assignment_role),
        employee_id: values.employee_id,
        job_id: jobId,
        notes: emptyToNull(values.notes),
        planned_end_time: emptyToNull(values.planned_end_time),
        planned_start_time: emptyToNull(values.planned_start_time),
        user_id: user.id,
      });

    setIsSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setValues(emptyAssignmentForm);
    await onChanged();
  }

  async function removeAssignment(id: string) {
    setError("");
    const { error: deleteError } = await supabase
      .from("job_assignments")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await onChanged();
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-950">
          Beosztott dolgozók
        </h2>
      </CardHeader>
      <CardContent className="grid gap-5">
        {error ? <ErrorMessage message={error} /> : null}

        <form
          className="grid min-w-0 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-2 md:items-end"
          onSubmit={handleSubmit}
        >
          <Select
            label="Dolgozó"
            onChange={(event) => updateField("employee_id", event.target.value)}
            value={values.employee_id}
          >
            <option value="">Válassz dolgozót</option>
            {employees
              .filter((employee) => employee.is_active)
              .map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
          </Select>
          <Input
            label="Szerep"
            onChange={(event) =>
              updateField("assignment_role", event.target.value)
            }
            value={values.assignment_role}
          />
          <Input
            label="Tervezett kezdés"
            onChange={(event) =>
              updateField("planned_start_time", event.target.value)
            }
            type="time"
            value={values.planned_start_time}
          />
          <Input
            label="Tervezett vége"
            onChange={(event) =>
              updateField("planned_end_time", event.target.value)
            }
            type="time"
            value={values.planned_end_time}
          />
          <Input
            label="Megjegyzés"
            onChange={(event) => updateField("notes", event.target.value)}
            value={values.notes}
          />
          <Button isLoading={isSubmitting} type="submit">
            Hozzáadás
          </Button>
        </form>

        {assignments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Még nincs beosztott dolgozó ehhez a munkához.
          </div>
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th>Dolgozó</Th>
                <Th>Szerep</Th>
                <Th>Tervezett idő</Th>
                <Th>Megjegyzés</Th>
                <Th className="text-right">Műveletek</Th>
              </Tr>
            </THead>
            <TBody>
              {assignments.map((assignment) => (
                <Tr key={assignment.id}>
                  <Td className="font-semibold text-slate-950">
                    {assignment.employee?.name || "Törölt dolgozó"}
                  </Td>
                  <Td>{assignment.assignment_role || "-"}</Td>
                  <Td>
                    {formatTime(assignment.planned_start_time)} -{" "}
                    {formatTime(assignment.planned_end_time)}
                  </Td>
                  <Td>{assignment.notes || "-"}</Td>
                  <Td>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => removeAssignment(assignment.id)}
                        size="sm"
                        variant="ghost"
                      >
                        Eltávolítás
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
  );
}
