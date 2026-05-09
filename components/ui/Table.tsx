import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-slate-50/90 text-xs uppercase tracking-wide text-slate-500">
      {children}
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>;
}

export function Tr({ children, className }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("align-top", className)}>{children}</tr>;
}

export function Th({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("whitespace-nowrap px-4 py-3 font-semibold", className)} {...props}>
      {children}
    </th>
  );
}

export function Td({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3 text-slate-700", className)} {...props}>
      {children}
    </td>
  );
}
