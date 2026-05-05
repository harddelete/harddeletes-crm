"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { calculateLineTotal, calculateQuoteTotals, formatCurrency } from "@/lib/calculations";
import { quoteStatusOptions } from "@/lib/status";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { ClientRow } from "@/types/database";
import type { QuoteFormSubmission, QuoteFormValues, QuoteItemDraft } from "@/types/quote";

const emptyItem: QuoteItemDraft = {
  description: "",
  line_total: 0,
  name: "",
  quantity: 1,
  unit: "db",
  unit_price: 0,
};

export function createEmptyQuoteForm(defaultVatRate = 27): QuoteFormValues {
  return {
    client_id: "",
    description: "",
    items: [{ ...emptyItem }],
    status: "draft",
    title: "",
    valid_until: "",
    vat_rate: defaultVatRate,
  };
}

type QuoteFormProps = {
  cancelHref?: string;
  clients: ClientRow[];
  defaultVatRate?: number;
  initialValues?: QuoteFormValues;
  onSubmit: (values: QuoteFormSubmission) => Promise<void>;
  submitLabel: string;
};

export function QuoteForm({
  cancelHref = "/quotes",
  clients,
  defaultVatRate = 27,
  initialValues,
  onSubmit,
  submitLabel,
}: QuoteFormProps) {
  const [values, setValues] = useState<QuoteFormValues>(
    initialValues ?? createEmptyQuoteForm(defaultVatRate),
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsWithTotals = useMemo(
    () =>
      values.items.map((item) => ({
        ...item,
        line_total: calculateLineTotal(item.quantity, item.unit_price),
      })),
    [values.items],
  );

  const totals = useMemo(
    () => calculateQuoteTotals(itemsWithTotals, values.vat_rate),
    [itemsWithTotals, values.vat_rate],
  );

  function updateField<K extends keyof QuoteFormValues>(
    field: K,
    value: QuoteFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function updateItem<K extends keyof QuoteItemDraft>(
    index: number,
    field: K,
    value: QuoteItemDraft[K],
  ) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addItem() {
    setValues((current) => ({
      ...current,
      items: [...current.items, { ...emptyItem }],
    }));
  }

  function removeItem(index: number) {
    setValues((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_item, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!values.client_id) {
      setError("Válassz ügyfelet az ajánlathoz.");
      return;
    }

    if (!values.title.trim()) {
      setError("Az ajánlat címe kötelező.");
      return;
    }

    if (values.vat_rate < 0 || values.vat_rate > 100) {
      setError("Az ÁFA kulcs 0 és 100 között legyen.");
      return;
    }

    const invalidItem = itemsWithTotals.find(
      (item) =>
        !item.name.trim() ||
        item.quantity <= 0 ||
        item.unit_price < 0 ||
        !item.unit.trim(),
    );

    if (invalidItem) {
      setError("Minden tételnél kötelező a megnevezés, a pozitív mennyiség és az egység.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        ...values,
        ...totals,
        items: itemsWithTotals,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Nem sikerült menteni az árajánlatot.",
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
          <h2 className="text-base font-semibold text-slate-950">Ajánlat adatai</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Ügyfél"
              onChange={(event) => updateField("client_id", event.target.value)}
              required
              value={values.client_id}
            >
              <option value="">Válassz ügyfelet</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name || client.name}
                </option>
              ))}
            </Select>
            <Select
              label="Státusz"
              onChange={(event) =>
                updateField("status", event.target.value as QuoteFormValues["status"])
              }
              value={values.status}
            >
              {quoteStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
            <Input
              label="Cím"
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Klíma telepítés"
              required
              value={values.title}
            />
            <Input
              label="Érvényességi dátum"
              onChange={(event) => updateField("valid_until", event.target.value)}
              type="date"
              value={values.valid_until}
            />
            <Input
              label="ÁFA (%)"
              min={0}
              onChange={(event) =>
                updateField("vat_rate", Number(event.target.value))
              }
              type="number"
              value={values.vat_rate}
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Leírás"
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Röviden írd le az ajánlat tartalmát."
              value={values.description}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-slate-950">Tételek</h2>
          <Button onClick={addItem} size="sm" variant="outline">
            <Plus size={16} />
            Tétel hozzáadása
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4">
          {itemsWithTotals.map((item, index) => (
            <div
              className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1.2fr_1.4fr_100px_90px_130px_120px_40px] lg:items-end"
              key={`${item.id ?? "new"}-${index}`}
            >
              <Input
                label="Megnevezés"
                onChange={(event) => updateItem(index, "name", event.target.value)}
                placeholder="Munkaóra"
                value={item.name}
              />
              <Input
                label="Leírás"
                onChange={(event) =>
                  updateItem(index, "description", event.target.value)
                }
                placeholder="Szerelési munka"
                value={item.description}
              />
              <Input
                label="Mennyiség"
                min={0}
                onChange={(event) =>
                  updateItem(index, "quantity", Number(event.target.value))
                }
                step="0.01"
                type="number"
                value={item.quantity}
              />
              <Input
                label="Egység"
                onChange={(event) => updateItem(index, "unit", event.target.value)}
                value={item.unit}
              />
              <Input
                label="Egységár"
                min={0}
                onChange={(event) =>
                  updateItem(index, "unit_price", Number(event.target.value))
                }
                step="1"
                type="number"
                value={item.unit_price}
              />
              <div className="grid gap-1.5 text-sm font-medium text-slate-700">
                <span>Összeg</span>
                <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950">
                  {formatCurrency(item.line_total)}
                </div>
              </div>
              <Button
                aria-label="Tétel törlése"
                disabled={itemsWithTotals.length === 1}
                onClick={() => removeItem(index)}
                size="sm"
                variant="ghost"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Link className={buttonClasses({ variant: "outline" })} href={cancelHref}>
            Mégsem
          </Link>
          <Button isLoading={isSubmitting} type="submit">
            {submitLabel}
          </Button>
        </div>

        <Card>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Nettó összeg</span>
              <strong className="text-slate-950">{formatCurrency(totals.subtotal)}</strong>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>ÁFA</span>
              <strong className="text-slate-950">{formatCurrency(totals.vat_amount)}</strong>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between text-base font-semibold text-slate-950">
                <span>Bruttó végösszeg</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
