"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { jobStatusOptions } from "@/lib/jobStatus";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { ClientRow, QuoteRow } from "@/types/database";
import type { JobFormValues, JobStatus } from "@/types/job";

export const emptyJobForm: JobFormValues = {
  address: "",
  city: "",
  client_id: "",
  contact_email: "",
  contact_name: "",
  contact_phone: "",
  description: "",
  end_time: "",
  event_date: "",
  event_type: "",
  expected_participants: null,
  internal_notes: "",
  location_name: "",
  price: 0,
  quote_id: "",
  start_time: "",
  status: "inquiry",
  title: "",
};

type JobFormProps = {
  cancelHref?: string;
  clients: ClientRow[];
  initialValues?: JobFormValues;
  onSubmit: (values: JobFormValues) => Promise<void>;
  quotes: QuoteRow[];
  submitLabel: string;
};

export function JobForm({
  cancelHref = "/jobs",
  clients,
  initialValues = emptyJobForm,
  onSubmit,
  quotes,
  submitLabel,
}: JobFormProps) {
  const [values, setValues] = useState<JobFormValues>(initialValues);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof JobFormValues>(
    field: K,
    value: JobFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!values.title.trim()) {
      setError("A munka / rendezvény neve kötelező.");
      return;
    }

    if (!values.event_date) {
      setError("A dátum kötelező.");
      return;
    }

    if (!values.location_name.trim() && !values.city.trim()) {
      setError("Adj meg helyszínt vagy települést.");
      return;
    }

    if (values.start_time && values.end_time && values.end_time < values.start_time) {
      setError("A befejezés nem lehet korábbi, mint a kezdés.");
      return;
    }

    if (values.contact_email.trim() && !values.contact_email.includes("@")) {
      setError("A kapcsolattartó email címe nem megfelelő.");
      return;
    }

    if (values.price < 0) {
      setError("A vállalási ár nem lehet negatív.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Nem sikerült menteni a munkát.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      {error ? <ErrorMessage message={error} /> : null}

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">
            Rendezvény adatai
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Munka / rendezvény neve"
              onChange={(event) => updateField("title", event.target.value)}
              required
              value={values.title}
            />
            <Input
              label="Rendezvény típusa"
              onChange={(event) => updateField("event_type", event.target.value)}
              value={values.event_type}
            />
            <Select
              label="Ügyfél / szervező"
              onChange={(event) => updateField("client_id", event.target.value)}
              value={values.client_id}
            >
              <option value="">Nincs kapcsolt ügyfél</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name || client.name}
                </option>
              ))}
            </Select>
            <Select
              label="Kapcsolódó árajánlat"
              onChange={(event) => updateField("quote_id", event.target.value)}
              value={values.quote_id}
            >
              <option value="">Nincs kapcsolt ajánlat</option>
              {quotes.map((quote) => (
                <option key={quote.id} value={quote.id}>
                  {quote.quote_number} - {quote.title}
                </option>
              ))}
            </Select>
            <Input
              label="Helyszín neve"
              onChange={(event) => updateField("location_name", event.target.value)}
              value={values.location_name}
            />
            <Input
              label="Település"
              onChange={(event) => updateField("city", event.target.value)}
              value={values.city}
            />
            <Input
              label="Cím"
              onChange={(event) => updateField("address", event.target.value)}
              value={values.address}
            />
            <Select
              label="Státusz"
              onChange={(event) =>
                updateField("status", event.target.value as JobStatus)
              }
              required
              value={values.status}
            >
              {jobStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
            <Input
              label="Dátum"
              onChange={(event) => updateField("event_date", event.target.value)}
              required
              type="date"
              value={values.event_date}
            />
            <Input
              label="Kezdés"
              onChange={(event) => updateField("start_time", event.target.value)}
              type="time"
              value={values.start_time}
            />
            <Input
              label="Befejezés"
              onChange={(event) => updateField("end_time", event.target.value)}
              type="time"
              value={values.end_time}
            />
            <Input
              label="Várható résztvevők száma"
              min={0}
              onChange={(event) =>
                updateField(
                  "expected_participants",
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              type="number"
              value={values.expected_participants ?? ""}
            />
            <Input
              label="Vállalási ár"
              min={0}
              onChange={(event) => updateField("price", Number(event.target.value))}
              type="number"
              value={values.price}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">
            Kapcsolattartó és megjegyzések
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Helyszíni kapcsolattartó"
              onChange={(event) => updateField("contact_name", event.target.value)}
              value={values.contact_name}
            />
            <Input
              label="Kapcsolattartó telefonszáma"
              onChange={(event) => updateField("contact_phone", event.target.value)}
              value={values.contact_phone}
            />
            <Input
              label="Kapcsolattartó email"
              onChange={(event) => updateField("contact_email", event.target.value)}
              type="email"
              value={values.contact_email}
            />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Textarea
              label="Leírás"
              onChange={(event) => updateField("description", event.target.value)}
              value={values.description}
            />
            <Textarea
              label="Belső megjegyzés"
              onChange={(event) =>
                updateField("internal_notes", event.target.value)
              }
              value={values.internal_notes}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link className={buttonClasses({ variant: "outline" })} href={cancelHref}>
          Mégsem
        </Link>
        <Button isLoading={isSubmitting} type="submit">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
