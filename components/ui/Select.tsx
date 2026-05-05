import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  label?: string;
};

export function Select({ children, className, error, id, label, ...props }: SelectProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label ? <span>{label}</span> : null}
      <select
        className={cn(
          "h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15",
          error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15",
          className,
        )}
        id={id}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
