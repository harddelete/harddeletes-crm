import type { ReactNode } from "react";

type PageHeaderProps = {
  actions?: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
