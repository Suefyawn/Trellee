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
    // No observer support (or SSR edge cases): show immediately.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }
      },
      // Reveal as soon as any part enters, and start a bit before the element
      // scrolls into view, so fast scrolling never leaves blank/dark sections.
      { threshold: 0, rootMargin: "0px 0px 15% 0px" },
    );
    observer.observe(el);

    // Safety net: if for any reason the observer hasn't fired shortly after
    // mount (e.g. element already on screen), reveal it.
    const t = setTimeout(() => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
    }, 200);

    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
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
