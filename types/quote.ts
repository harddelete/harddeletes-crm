export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "paid";

export type QuoteItemDraft = {
  id?: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
};

export type QuoteFormValues = {
  client_id: string;
  title: string;
  description: string;
  status: QuoteStatus;
  vat_rate: number;
  valid_until: string;
  items: QuoteItemDraft[];
};

export type QuoteFormSubmission = QuoteFormValues & {
  subtotal: number;
  vat_amount: number;
  total: number;
};
