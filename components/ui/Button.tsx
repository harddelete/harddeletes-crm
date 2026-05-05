import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  isLoading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function buttonClasses({
  className,
  size = "md",
  variant = "primary",
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
    size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm",
    variant === "primary" && "bg-teal-700 text-white hover:bg-teal-800",
    variant === "secondary" && "bg-slate-900 text-white hover:bg-slate-800",
    variant === "ghost" && "text-slate-700 hover:bg-slate-100",
    variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
    variant === "outline" &&
      "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    className,
  );
}

export function Button({
  children,
  className,
  disabled,
  isLoading,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ className, size, variant })}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {isLoading ? "Feldolgozás..." : children}
    </button>
  );
}
