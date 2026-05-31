import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Trellee wordmark — the real PNG from the live trellee.com brand assets.
 * Source: 300×150 black-on-transparent. Site is dark-themed, so we invert
 * the bitmap with a CSS filter to render it white. If a colored variant
 * ever lands in /public/brand, swap the src + drop the invert filter.
 */
export function Logo({
  size = "md",
  className,
  invert = true,
  priority = false,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Invert to white. Default true since the site is dark-themed. */
  invert?: boolean;
  priority?: boolean;
}) {
  const dims = {
    sm: { w: 96, h: 48 },
    md: { w: 132, h: 66 },
    lg: { w: 180, h: 90 },
  }[size];

  return (
    <Image
      src="/brand/trellee-logo.png"
      alt="Trellee"
      width={dims.w}
      height={dims.h}
      priority={priority}
      className={cn(
        "block w-auto",
        size === "sm" && "h-6",
        size === "md" && "h-7",
        size === "lg" && "h-10",
        invert && "[filter:invert(1)_brightness(1.05)]",
        className,
      )}
    />
  );
}
