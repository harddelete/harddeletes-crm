"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isConfigured, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && isConfigured && !user) {
      router.replace("/login");
    }
  }, [isConfigured, isLoading, router, user]);

  if (!isConfigured) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
        <ErrorMessage message="A Supabase nincs beállítva. Hozz létre .env.local fájlt a .env.example alapján, majd indítsd újra a fejlesztői szervert." />
      </main>
    );
  }

  if (isLoading || !user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
        <LoadingState label="Bejelentkezés ellenőrzése..." />
      </main>
    );
  }

  return <>{children}</>;
}
