import type { QuoteItemDraft } from "@/types/quote";

export function roundMoney(amount: number) {
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100) / 100;
}

export function calculateLineTotal(quantity: number, unitPrice: number) {
  return roundMoney(quantity * unitPrice);
}

export function calculateSubtotal(items: Pick<QuoteItemDraft, "line_total">[]) {
  return roundMoney(
    items.reduce((sum, item) => sum + Number(item.line_total || 0), 0),
  );
}

export function calculateVatAmount(subtotal: number, vatRate: number) {
  return roundMoney((subtotal * vatRate) / 100);
}

export function calculateTotal(subtotal: number, vatAmount: number) {
  return roundMoney(subtotal + vatAmount);
}

export function calculateQuoteTotals(
  items: Pick<QuoteItemDraft, "quantity" | "unit_price">[],
  vatRate: number,
) {
  const itemsWithTotals = items.map((item) => ({
    ...item,
    line_total: calculateLineTotal(item.quantity, item.unit_price),
  }));
  const subtotal = calculateSubtotal(itemsWithTotals);
  const vat_amount = calculateVatAmount(subtotal, vatRate);
  const total = calculateTotal(subtotal, vat_amount);

  return {
    subtotal,
    vat_amount,
    total,
  };
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("hu-HU", {
    currency: "HUF",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount || 0);
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) {
    return "-";
  }

  const parsed = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("hu-HU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}
