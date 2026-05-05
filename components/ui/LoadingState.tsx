export function LoadingState({ label = "Betöltés..." }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500">
      {label}
    </div>
  );
}
