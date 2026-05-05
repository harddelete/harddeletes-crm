import type { QuoteStatus } from "@/types/quote";

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  accepted: "Elfogadva",
  draft: "Piszkozat",
  paid: "Fizetve",
  rejected: "Elutasítva",
  sent: "Elküldve",
};

export const quoteStatusOptions: { label: string; value: QuoteStatus }[] = [
  { label: quoteStatusLabels.draft, value: "draft" },
  { label: quoteStatusLabels.sent, value: "sent" },
  { label: quoteStatusLabels.accepted, value: "accepted" },
  { label: quoteStatusLabels.rejected, value: "rejected" },
  { label: quoteStatusLabels.paid, value: "paid" },
];

export function getStatusTone(status: QuoteStatus) {
  switch (status) {
    case "draft":
      return "slate";
    case "sent":
      return "blue";
    case "accepted":
      return "emerald";
    case "rejected":
      return "rose";
    case "paid":
      return "amber";
  }
}
