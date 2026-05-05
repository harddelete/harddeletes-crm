"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Users,
} from "lucide-react";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "./BrandLogo";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: BriefcaseBusiness, label: "Munkák" },
  { href: "/employees", icon: Users, label: "Dolgozók" },
  { href: "/equipment", icon: Package, label: "Eszközök" },
  { href: "/clients", icon: Users, label: "Ügyfelek" },
  { href: "/quotes", icon: FileText, label: "Árajánlatok" },
  { href: "/settings", icon: Settings, label: "Beállítások" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:flex-col">
        <Link className="flex items-center px-2" href="/dashboard">
          <BrandLogo priority size="desktop" />
        </Link>

        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
                  active && "bg-teal-50 text-teal-800",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <Button
            className="w-full justify-start"
            onClick={handleSignOut}
            variant="ghost"
          >
            <LogOut size={18} />
            Kijelentkezés
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link className="flex items-center" href="/dashboard">
              <BrandLogo priority size="mobile" />
            </Link>
            <Button onClick={handleSignOut} size="sm" variant="ghost">
              <LogOut size={18} />
            </Button>
          </div>
          <nav className="mt-3 flex gap-1 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600",
                    active && "bg-teal-50 text-teal-800",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
