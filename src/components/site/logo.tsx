import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Trellee wordmark — the real brand assets from the live trellee.com site.
 * Two captured variants (2000×1000, transparent):
 *   /brand/trellee-logo-white.png — white, for the dark theme (default)
 *   /brand/trellee-logo.png       — black, for light backgrounds (print, etc.)
 */
export function Logo({
  size = "md",
  className,
  invert = true,
  priority = false,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** White wordmark for dark backgrounds. Default true (the site is dark). */
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
      src={invert ? "/brand/trellee-logo-white.png" : "/brand/trellee-logo.png"}
      alt="Trellee"
      width={dims.w}
      height={dims.h}
      priority={priority}
      className={cn(
        "block w-auto",
        size === "sm" && "h-8",
        size === "md" && "h-9",
        size === "lg" && "h-12",
        className,
      )}
    />
  );
}
