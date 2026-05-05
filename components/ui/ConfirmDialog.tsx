"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

type ConfirmDialogProps = {
  confirmLabel?: string;
  description: string;
  isOpen: boolean;
  isWorking?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

export function ConfirmDialog({
  confirmLabel = "Törlés",
  description,
  isOpen,
  isWorking,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-rose-50 p-2 text-rose-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button disabled={isWorking} onClick={onCancel} variant="outline">
            Mégsem
          </Button>
          <Button isLoading={isWorking} onClick={onConfirm} variant="danger">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
