import { Logo } from "@/components/layout/Logo";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  size?: "desktop" | "mobile" | "auth";
};

export function BrandLogo({ className, size = "desktop" }: BrandLogoProps) {
  const logoSize =
    size === "auth" ? "large" : size === "mobile" ? "compact" : "default";

  return <Logo className={className} size={logoSize} />;
}
