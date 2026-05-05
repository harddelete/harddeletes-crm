import { getStatusTone, quoteStatusLabels } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { QuoteStatus } from "@/types/quote";

export type BadgeTone =
  | "amber"
  | "blue"
  | "emerald"
  | "purple"
  | "rose"
  | "slate"
  | "teal";

const toneClasses: Record<BadgeTone, string> = {
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-700",
  purple: "bg-purple-50 text-purple-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
  teal: "bg-teal-50 text-teal-700",
};

export function TextBadge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-2.5 text-xs font-semibold",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

type BadgeProps = {
  status: QuoteStatus;
};

export function StatusBadge({ status }: BadgeProps) {
  const tone = getStatusTone(status);

  return <TextBadge tone={tone}>{quoteStatusLabels[status]}</TextBadge>;
}
