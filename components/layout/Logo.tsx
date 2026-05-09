import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "compact" | "default" | "large";
};

export function Logo({ className, size = "default" }: LogoProps) {
  const iconSize = size === "large" ? "h-14 w-14" : size === "compact" ? "h-8 w-8" : "h-10 w-10";
  const titleSize =
    size === "large" ? "text-2xl" : size === "compact" ? "text-base" : "text-lg";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative grid shrink-0 place-items-center rounded-2xl border border-teal-500/20 bg-slate-950 text-teal-200 shadow-lg shadow-teal-950/10",
          iconSize,
        )}
      >
        <svg
          aria-hidden="true"
          className="h-3/5 w-3/5"
          fill="none"
          viewBox="0 0 64 64"
        >
          <circle cx="32" cy="32" r="7" fill="currentColor" />
          <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="4" />
          <path
            d="M32 2v12M32 50v12M2 32h12M50 32h12M11 11l9 9M44 44l9 9M53 11l-9 9M20 44l-9 9"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="4"
          />
        </svg>
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate font-semibold tracking-normal text-slate-950",
            titleSize,
          )}
        >
          Harddelete&apos;s CRM
        </span>
        {size !== "compact" ? (
          <span className="block truncate text-xs font-medium text-slate-500">
            Rendezvényes munkaszervező
          </span>
        ) : null}
      </span>
    </div>
  );
}
