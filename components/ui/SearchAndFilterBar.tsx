import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "./Input";

type SearchAndFilterBarProps = {
  children?: ReactNode;
  onSearchChange: (value: string) => void;
  search: string;
};

export function SearchAndFilterBar({
  children,
  onSearchChange,
  search,
}: SearchAndFilterBarProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <Input
          aria-label="Keresés"
          className="pl-10"
          onChange={(event) => onSearchChange(event.target.value)}
          value={search}
        />
      </div>
      {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
    </div>
  );
}
