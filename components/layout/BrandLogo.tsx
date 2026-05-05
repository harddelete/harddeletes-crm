import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  size?: "desktop" | "mobile" | "auth";
};

export function BrandLogo({
  className,
  priority,
  size = "desktop",
}: BrandLogoProps) {
  const imageSize =
    size === "auth"
      ? { height: 84, width: 240 }
      : size === "mobile"
        ? { height: 46, width: 140 }
        : { height: 60, width: 180 };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        alt="Harddelete's CRM logo"
        className={cn(
          "w-auto object-contain",
          size === "auth" && "h-16",
          size === "mobile" && "h-8",
          size === "desktop" && "h-10",
        )}
        height={imageSize.height}
        priority={priority}
        src="/logo.png"
        width={imageSize.width}
      />
      <span className="sr-only">Harddelete&apos;s CRM</span>
    </div>
  );
}
