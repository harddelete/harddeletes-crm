"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

type CrmAssistantPanelProps = {
  context: unknown;
  missingItems?: string[];
  mode?: "dashboard" | "job";
  title?: string;
};

export function CrmAssistantPanel({
  context,
  missingItems = [],
  mode = "job",
  title = "AI CRM asszisztens",
}: CrmAssistantPanelProps) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");

  async function handleGenerate() {
    setError("");
    setText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/crm-assistant", {
        body: JSON.stringify({
          context,
          missingItems,
          mode,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = (await response.json()) as { error?: string; text?: string };

      if (!response.ok) {
        setError(data.error || "Nem sikerült AI összefoglalót készíteni.");
        return;
      }

      setText(data.text || "");
    } catch {
      setError("Nem sikerült kapcsolódni az AI asszisztenshez.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-teal-50 p-2 text-teal-700">
            <Sparkles size={18} />
          </span>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        </div>
        <Button isLoading={isLoading} onClick={handleGenerate} size="sm">
          Összefoglaló készítése
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {missingItems.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Hiányzó adatok: {missingItems.join(", ")}
          </div>
        ) : null}
        {error ? <ErrorMessage message={error} /> : null}
        {text ? (
          <div className="whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {text}
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-500">
            Rövid munkaszervezési összefoglalót, checklistát és kockázati pontokat
            készít a meglévő adatok alapján.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
