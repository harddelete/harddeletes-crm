"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { signInWithEmail, signUpWithEmail } from "@/lib/auth";
import { useAuth } from "./AuthProvider";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { isConfigured, isLoading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.includes("@")) {
      setError("Adj meg egy érvényes email címet.");
      return;
    }

    if (password.length < 6) {
      setError("A jelszó legalább 6 karakter legyen.");
      return;
    }

    setIsSubmitting(true);

    const result =
      mode === "login"
        ? await signInWithEmail(email.trim(), password)
        : await signUpWithEmail(email.trim(), password);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (
      mode === "register" &&
      "needsEmailConfirmation" in result &&
      result.needsEmailConfirmation
    ) {
      setMessage(
        "A regisztráció sikeres. Nézd meg az emailedet a megerősítéshez.",
      );
      return;
    }

    router.replace("/dashboard");
  }

  const isLogin = mode === "login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <BrandLogo className="justify-center" priority size="auth" />
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {isLogin ? "Bejelentkezés" : "Regisztráció"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isLogin
              ? "Lépj be a rendezvények és ügyfelek kezeléséhez."
              : "Hozd létre a Harddelete's CRM fiókodat."}
          </p>
        </div>

        <Card>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              {!isConfigured ? (
                <ErrorMessage message="A Supabase nincs beállítva. Másold a .env.example fájlt .env.local néven, majd add meg a projekt URL-t és anon kulcsot." />
              ) : null}
              {error ? <ErrorMessage message={error} /> : null}
              {message ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}

              <Input
                autoComplete="email"
                label="Email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nev@ceg.hu"
                type="email"
                value={email}
              />
              <Input
                autoComplete={isLogin ? "current-password" : "new-password"}
                label="Jelszó"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Legalább 6 karakter"
                type="password"
                value={password}
              />
              <Button
                disabled={!isConfigured}
                isLoading={isSubmitting}
                type="submit"
              >
                {isLogin ? "Belépés" : "Fiók létrehozása"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-sm text-slate-600">
          {isLogin ? "Nincs még fiókod?" : "Van már fiókod?"}{" "}
          <Link
            className="font-semibold text-teal-700 hover:text-teal-800"
            href={isLogin ? "/register" : "/login"}
          >
            {isLogin ? "Regisztrálj" : "Jelentkezz be"}
          </Link>
        </p>
      </div>
    </main>
  );
}
