import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  helperText?: string;
  label?: string;
};

export function Input({
  className,
  error,
  helperText,
  id,
  label,
  ...props
}: InputProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label ? <span>{label}</span> : null}
      <input
        className={cn(
          "h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15",
          error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15",
          className,
        )}
        id={id}
        {...props}
      />
      {helperText && !error ? (
        <span className="text-xs font-normal text-slate-500">{helperText}</span>
      ) : null}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
