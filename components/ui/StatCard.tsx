import type { ReactNode } from "react";
import { Card, CardContent } from "./Card";

type StatCardProps = {
  icon?: ReactNode;
  label: string;
  value: string;
};

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4">
        {icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold text-slate-950">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
