import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
  label?: string;
};

export function Textarea({
  className,
  error,
  id,
  label,
  ...props
}: TextareaProps) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700">
      {label ? <span>{label}</span> : null}
      <textarea
        className={cn(
          "min-h-24 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15",
          error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15",
          className,
        )}
        id={id}
        {...props}
      />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
