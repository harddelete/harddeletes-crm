"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { employmentTypeOptions } from "@/lib/employee";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { EmployeeFormValues, EmploymentType } from "@/types/employee";

export const emptyEmployeeForm: EmployeeFormValues = {
  email: "",
  employment_type: "occasional",
  hourly_rate: 0,
  is_active: true,
  job_title: "",
  name: "",
  notes: "",
  phone: "",
  position: "",
};

type EmployeeFormProps = {
  cancelHref?: string;
  initialValues?: EmployeeFormValues;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  submitLabel: string;
};

export function EmployeeForm({
  cancelHref = "/employees",
  initialValues = emptyEmployeeForm,
  onSubmit,
  submitLabel,
}: EmployeeFormProps) {
  const [values, setValues] = useState<EmployeeFormValues>(initialValues);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof EmployeeFormValues>(
    field: K,
    value: EmployeeFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!values.name.trim()) {
      setError("A dolgozó neve kötelező.");
      return;
    }

    if (values.email.trim() && !values.email.includes("@")) {
      setError("Az email cím formátuma nem megfelelő.");
      return;
    }

    if (values.hourly_rate < 0) {
      setError("Az óradíj nem lehet negatív.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Nem sikerült menteni a dolgozót.",
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
              placeholder="Nagy Péter"
              required
              value={values.name}
            />
            <Input
              label="Email"
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="nev@email.hu"
              type="email"
              value={values.email}
            />
            <Input
              label="Telefonszám"
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="+36 30 123 4567"
              value={values.phone}
            />
            <Input
              label="Munkakör"
              onChange={(event) => updateField("job_title", event.target.value)}
              placeholder="Sofőr, animátor, karbantartó"
              value={values.job_title}
            />
            <Input
              label="Pozíció / szerepkör"
              onChange={(event) => updateField("position", event.target.value)}
              placeholder="Helyszíni felelős"
              value={values.position}
            />
            <Select
              label="Foglalkoztatás típusa"
              onChange={(event) =>
                updateField("employment_type", event.target.value as EmploymentType)
              }
              value={values.employment_type}
            >
              {employmentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Input
              label="Óradíj"
              min={0}
              onChange={(event) =>
                updateField("hourly_rate", Number(event.target.value))
              }
              type="number"
              value={values.hourly_rate}
            />
            <label className="flex h-10 items-center gap-2 self-end text-sm font-medium text-slate-700">
              <input
                checked={values.is_active}
                className="h-4 w-4 rounded border-slate-300 text-teal-700"
                onChange={(event) =>
                  updateField("is_active", event.target.checked)
                }
                type="checkbox"
              />
              Aktív dolgozó
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
