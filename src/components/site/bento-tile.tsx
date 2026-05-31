"use client";

import { useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Cursor-tracked bento tile with brand-tinted glow that follows the pointer.
 * Sets `--mx`/`--my` CSS variables consumed by `.bento-tile::before` in globals.css.
 *
 * Important: the user-provided className is applied to the outermost element
 * (the Link when href is set, otherwise the div). This is what makes
 * `col-span-*` / `row-span-*` classes actually participate in the parent grid —
 * an earlier version put them on the inner div, which made every tile collapse
 * to the default 1-column width.
 */
export function BentoTile({
  href,
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  if (href) {
    return (
      <Link
        href={href}
        ref={ref as unknown as React.RefObject<HTMLAnchorElement>}
        onMouseMove={handleMove}
        className={cn("bento-tile group block", className)}
      >
        {children}
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={cn("bento-tile group", className)}
    >
      {children}
    </div>
  );
}
