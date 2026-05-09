import { Logo } from "@/components/layout/Logo";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  size?: "desktop" | "mobile" | "auth";
};

export function BrandLogo({ className, priority, size = "desktop" }: BrandLogoProps) {
  const logoSize =
    size === "auth" ? "large" : size === "mobile" ? "compact" : "default";

  return <Logo className={className} preload={priority} size={logoSize} />;
}
