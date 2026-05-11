import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  preload?: boolean;
  size?: "compact" | "default" | "large";
};

const sizeClasses = {
  compact: "w-10 max-w-[22vw] sm:w-12",
  default: "w-40 max-w-full",
  large: "w-56 max-w-[72vw] sm:w-64",
};

export function Logo({ className, preload, size = "default" }: LogoProps) {
  return (
    <div className={cn("flex min-w-0 items-center", className)}>
      <Image
        alt="Harddelete's CRM logo"
        className={cn(
          "h-auto shrink-0 object-contain mix-blend-multiply",
          sizeClasses[size],
        )}
        height={512}
        preload={preload ?? size === "large"}
        sizes={
          size === "large"
            ? "(max-width: 640px) 224px, 256px"
            : size === "compact"
              ? "(max-width: 640px) 40px, 48px"
              : "160px"
        }
        src="/logo.png"
        width={512}
      />
      <span className="sr-only">Harddelete&apos;s CRM</span>
    </div>
  );
}
