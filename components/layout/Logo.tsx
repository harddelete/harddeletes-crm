import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  preload?: boolean;
  size?: "compact" | "default" | "large";
};

const sizeClasses = {
  compact: "w-[136px] max-w-[46vw]",
  default: "w-[176px] max-w-full",
  large: "w-[260px] max-w-[82vw]",
};

export function Logo({ className, preload, size = "default" }: LogoProps) {
  return (
    <div className={cn("flex min-w-0 items-center", className)}>
      <Image
        alt="Harddelete's CRM logo"
        className={cn("h-auto shrink-0 object-contain", sizeClasses[size])}
        height={724}
        preload={preload ?? size === "large"}
        src="/logo.png"
        width={2172}
      />
      <span className="sr-only">Harddelete&apos;s CRM</span>
    </div>
  );
}
