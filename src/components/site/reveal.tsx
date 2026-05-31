"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveal — IntersectionObserver-driven fade-up.
 * Use sparingly; honors prefers-reduced-motion automatically via CSS.
 */
export function Reveal({
  children,
  delay,
  className,
  as: As = "div",
}: {
  children: React.ReactNode;
  delay?: 1 | 2 | 3;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <As
      ref={ref as React.RefObject<HTMLElement>}
      className={cn(
        "reveal",
        delay === 1 && "reveal-d1",
        delay === 2 && "reveal-d2",
        delay === 3 && "reveal-d3",
        className,
      )}
    >
      {children}
    </As>
  );
}
