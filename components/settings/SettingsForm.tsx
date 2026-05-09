"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { ProfileFormValues } from "@/types/profile";

export const emptyProfileForm: ProfileFormValues = {
  address: "",
  bank_account: "",
  company_name: "",
  default_vat_rate: 27,
  email: "",
  owner_name: "",
  phone: "",
  quote_footer_text:
    "Köszönjük a megkeresést. Az ajánlat a megadott érvényességi dátumig érvényes.",
  tax_number: "",
};

type SettingsFormProps = {
  initialValues?: ProfileFormValues;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
};

export function SettingsForm({
  initialValues = emptyProfileForm,
  onSubmit,
}: SettingsFormProps) {
  const [values, setValues] = useState<ProfileFormValues>(initialValues);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(
    field: keyof ProfileFormValues,
    value: string | number,
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (values.default_vat_rate < 0 || values.default_vat_rate > 100) {
      setError("Az ÁFA kulcs 0 és 100 között legyen.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
      setSuccess("A beállítások mentve.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Nem sikerült menteni a beállításokat.",
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
          {success ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Cégnév"
              onChange={(event) => updateField("company_name", event.target.value)}
              value={values.company_name}
            />
            <Input
              label="Tulajdonos / kapcsolattartó"
              onChange={(event) => updateField("owner_name", event.target.value)}
              value={values.owner_name}
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
              label="Bankszámlaszám"
              onChange={(event) => updateField("bank_account", event.target.value)}
              value={values.bank_account}
            />
            <Input
              label="Alapértelmezett ÁFA (%)"
              min={0}
              onChange={(event) =>
                updateField("default_vat_rate", Number(event.target.value))
              }
              type="number"
              value={values.default_vat_rate}
            />
            <Input
              label="Cím"
              onChange={(event) => updateField("address", event.target.value)}
              value={values.address}
            />
          </div>

          <Textarea
            label="PDF lábléc szöveg"
            onChange={(event) =>
              updateField("quote_footer_text", event.target.value)
            }
            value={values.quote_footer_text}
          />

          <div className="flex justify-end">
            <Button isLoading={isSubmitting} type="submit">
              Beállítások mentése
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
