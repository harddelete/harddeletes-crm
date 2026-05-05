import { supabase } from "./supabaseClient";
import { emptyToNull } from "./utils";
import type { Json, QuoteRow } from "@/types/database";
import type { QuoteFormSubmission, QuoteItemDraft } from "@/types/quote";

function toQuoteItemsJson(items: QuoteItemDraft[]): Json {
  return items.map((item): { [key: string]: Json } => ({
    description: emptyToNull(item.description),
    name: item.name.trim(),
    quantity: item.quantity,
    unit: item.unit.trim(),
    unit_price: item.unit_price,
  }));
}

export async function createQuoteWithItems(
  values: QuoteFormSubmission,
): Promise<QuoteRow> {
  const { data, error } = await supabase.rpc("create_quote_with_items", {
    p_client_id: values.client_id,
    p_description: emptyToNull(values.description),
    p_items: toQuoteItemsJson(values.items),
    p_status: values.status,
    p_title: values.title.trim(),
    p_valid_until: emptyToNull(values.valid_until),
    p_vat_rate: values.vat_rate,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Az árajánlat mentése nem adott vissza eredményt.");
  }

  return data;
}

export async function updateQuoteWithItems(
  quoteId: string,
  values: QuoteFormSubmission,
): Promise<QuoteRow> {
  const { data, error } = await supabase.rpc("update_quote_with_items", {
    p_client_id: values.client_id,
    p_description: emptyToNull(values.description),
    p_items: toQuoteItemsJson(values.items),
    p_quote_id: quoteId,
    p_status: values.status,
    p_title: values.title.trim(),
    p_valid_until: emptyToNull(values.valid_until),
    p_vat_rate: values.vat_rate,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Az árajánlat mentése nem adott vissza eredményt.");
  }

  return data;
}
