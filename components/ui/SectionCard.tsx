import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "./Card";

type SectionCardProps = {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
  title: string;
};

export function SectionCard({
  actions,
  children,
  className,
  padded = true,
  title,
}: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {actions}
      </CardHeader>
      {padded ? <CardContent>{children}</CardContent> : children}
    </Card>
  );
}
