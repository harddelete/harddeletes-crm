"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { ClientFormValues } from "@/types/client";

export const emptyClientForm: ClientFormValues = {
  address: "",
  company_name: "",
  email: "",
  name: "",
  notes: "",
  phone: "",
  tax_number: "",
};

type ClientFormProps = {
  cancelHref?: string;
  initialValues?: ClientFormValues;
  onSubmit: (values: ClientFormValues) => Promise<void>;
  submitLabel: string;
};

export function ClientForm({
  cancelHref = "/clients",
  initialValues = emptyClientForm,
  onSubmit,
  submitLabel,
}: ClientFormProps) {
  const [values, setValues] = useState<ClientFormValues>(initialValues);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof ClientFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!values.name.trim()) {
      setError("Az ügyfél neve kötelező.");
      return;
    }

    if (values.email.trim() && !values.email.includes("@")) {
      setError("Az email cím formátuma nem megfelelő.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Nem sikerült menteni az ügyfelet.",
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
              label="Ügyfél neve"
              onChange={(event) => updateField("name", event.target.value)}
              required
              value={values.name}
            />
            <Input
              label="Cégnév"
              onChange={(event) => updateField("company_name", event.target.value)}
              value={values.company_name}
            />
            <Input
              label="Email"
              onChange={(event) => updateField("email", event.target.value)}
              type="email"
              value={values.email}
            />
            <Input
              label="Telefon"
              onChange={(event) => updateField("phone", event.target.value)}
              value={values.phone}
            />
            <Input
              label="Adószám"
              onChange={(event) => updateField("tax_number", event.target.value)}
              value={values.tax_number}
            />
            <Input
              label="Cím"
              onChange={(event) => updateField("address", event.target.value)}
              value={values.address}
            />
          </div>

          <Textarea
            label="Megjegyzés"
            onChange={(event) => updateField("notes", event.target.value)}
            value={values.notes}
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              className={buttonClasses({ variant: "outline" })}
              href={cancelHref}
            >
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
