import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "w-full min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn("min-w-0 border-b border-slate-200/80 px-5 py-4", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("min-w-0 p-5", className)}>{children}</div>;
}
