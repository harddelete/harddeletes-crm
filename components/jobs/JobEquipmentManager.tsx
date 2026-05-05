"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TBody, Td, THead, Th, Tr } from "@/components/ui/Table";
import { equipmentStatusLabels } from "@/lib/equipmentStatus";
import { supabase } from "@/lib/supabaseClient";
import { emptyToNull } from "@/lib/utils";
import type { EquipmentRow, JobEquipmentRow } from "@/types/database";
import type { JobEquipmentFormValues } from "@/types/job";

export type JobEquipmentWithItem = JobEquipmentRow & {
  equipment: EquipmentRow | null;
};

const emptyJobEquipmentForm: JobEquipmentFormValues = {
  equipment_id: "",
  notes: "",
  quantity: 1,
};

type JobEquipmentManagerProps = {
  equipment: EquipmentRow[];
  jobEquipment: JobEquipmentWithItem[];
  jobId: string;
  onChanged: () => Promise<void>;
};

export function JobEquipmentManager({
  equipment,
  jobEquipment,
  jobId,
  onChanged,
}: JobEquipmentManagerProps) {
  const { user } = useAuth();
  const [values, setValues] = useState<JobEquipmentFormValues>(
    emptyJobEquipmentForm,
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof JobEquipmentFormValues>(
    field: K,
    value: JobEquipmentFormValues[K],
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

    if (!values.equipment_id) {
      setError("Válassz eszközt.");
      return;
    }

    if (values.quantity <= 0) {
      setError("A mennyiség legalább 1 legyen.");
      return;
    }

    setIsSubmitting(true);

    const { error: insertError } = await supabase.from("job_equipment").insert({
      equipment_id: values.equipment_id,
      job_id: jobId,
      notes: emptyToNull(values.notes),
      quantity: values.quantity,
      user_id: user.id,
    });

    setIsSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setValues(emptyJobEquipmentForm);
    await onChanged();
  }

  async function removeEquipment(id: string) {
    setError("");
    const { error: deleteError } = await supabase
      .from("job_equipment")
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
          Hozzárendelt eszközök
        </h2>
      </CardHeader>
      <CardContent className="grid gap-5">
        {error ? <ErrorMessage message={error} /> : null}

        <form
          className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_120px_1fr_auto] lg:items-end"
          onSubmit={handleSubmit}
        >
          <Select
            label="Eszköz"
            onChange={(event) => updateField("equipment_id", event.target.value)}
            value={values.equipment_id}
          >
            <option value="">Válassz eszközt</option>
            {equipment
              .filter((item) => item.is_active)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </Select>
          <Input
            label="Mennyiség"
            min={1}
            onChange={(event) =>
              updateField("quantity", Number(event.target.value))
            }
            type="number"
            value={values.quantity}
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

        {jobEquipment.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Még nincs eszköz hozzárendelve ehhez a munkához.
          </div>
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th>Eszköz</Th>
                <Th>Típus</Th>
                <Th>Mennyiség</Th>
                <Th>Státusz</Th>
                <Th>Megjegyzés</Th>
                <Th className="text-right">Műveletek</Th>
              </Tr>
            </THead>
            <TBody>
              {jobEquipment.map((assignment) => (
                <Tr key={assignment.id}>
                  <Td className="font-semibold text-slate-950">
                    {assignment.equipment?.name || "Törölt eszköz"}
                  </Td>
                  <Td>{assignment.equipment?.type || "-"}</Td>
                  <Td>{assignment.quantity}</Td>
                  <Td>
                    {assignment.equipment
                      ? equipmentStatusLabels[assignment.equipment.status]
                      : "-"}
                  </Td>
                  <Td>{assignment.notes || "-"}</Td>
                  <Td>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => removeEquipment(assignment.id)}
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
