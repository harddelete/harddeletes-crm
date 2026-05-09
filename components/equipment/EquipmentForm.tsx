"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { equipmentStatusOptions } from "@/lib/equipmentStatus";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { EquipmentFormValues, EquipmentStatus } from "@/types/equipment";

export const emptyEquipmentForm: EquipmentFormValues = {
  capacity: null,
  identifier: "",
  is_active: true,
  name: "",
  notes: "",
  status: "available",
  type: "",
};

type EquipmentFormProps = {
  cancelHref?: string;
  initialValues?: EquipmentFormValues;
  onSubmit: (values: EquipmentFormValues) => Promise<void>;
  submitLabel: string;
};

export function EquipmentForm({
  cancelHref = "/equipment",
  initialValues = emptyEquipmentForm,
  onSubmit,
  submitLabel,
}: EquipmentFormProps) {
  const [values, setValues] = useState<EquipmentFormValues>(initialValues);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof EquipmentFormValues>(
    field: K,
    value: EquipmentFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!values.name.trim()) {
      setError("Az eszköz neve kötelező.");
      return;
    }

    if (values.capacity !== null && values.capacity < 0) {
      setError("A kapacitás nem lehet negatív.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Nem sikerült menteni az eszközt.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          {error ? <ErrorMessage message={error} /> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Név"
              onChange={(event) => updateField("name", event.target.value)}
              required
              value={values.name}
            />
            <Input
              label="Típus"
              onChange={(event) => updateField("type", event.target.value)}
              value={values.type}
            />
            <Input
              label="Azonosító"
              onChange={(event) => updateField("identifier", event.target.value)}
              value={values.identifier}
            />
            <Input
              label="Kapacitás"
              min={0}
              onChange={(event) =>
                updateField(
                  "capacity",
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              type="number"
              value={values.capacity ?? ""}
            />
            <Select
              label="Státusz"
              onChange={(event) =>
                updateField("status", event.target.value as EquipmentStatus)
              }
              value={values.status}
            >
              {equipmentStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <label className="flex h-10 items-center gap-2 self-end text-sm font-medium text-slate-700">
              <input
                checked={values.is_active}
                className="h-4 w-4 rounded border-slate-300 text-teal-700"
                onChange={(event) =>
                  updateField("is_active", event.target.checked)
                }
                type="checkbox"
              />
              Aktív eszköz
            </label>
          </div>

          <Textarea
            label="Megjegyzés"
            onChange={(event) => updateField("notes", event.target.value)}
            value={values.notes}
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link className={buttonClasses({ variant: "outline" })} href={cancelHref}>
              Mégsem
            </Link>
            <Button isLoading={isSubmitting} type="submit">
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
