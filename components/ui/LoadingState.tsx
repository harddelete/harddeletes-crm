export function LoadingState({ label = "Betöltés..." }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm shadow-slate-200/60">
      {label}
    </div>
  );
}
