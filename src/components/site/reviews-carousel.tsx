"use client";

import { useRef } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReviewRow } from "@/lib/types/database";

/**
 * Horizontal, scroll-snap carousel for the text testimonials. Native swipe on
 * touch; arrow buttons scroll by roughly one card on desktop. Bleeds to the
 * screen edge on mobile (via the negative margin) so cards can scroll edge to
 * edge, then sits inside the container on lg+.
 */
export function ReviewsCarousel({ reviews }: { reviews: ReviewRow[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByCards(dir: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    // first card width + gap; fall back to ~340px
    const first = track.firstElementChild as HTMLElement | null;
    const amount = first ? first.offsetWidth + 16 : 340;
    track.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div className="flex justify-end gap-2 mb-5">
        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          aria-label="Previous testimonials"
          className="w-10 h-10 rounded-md border border-border bg-surface flex items-center justify-center text-muted hover:text-fg hover:border-border-strong transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCards(1)}
          aria-label="Next testimonials"
          className="w-10 h-10 rounded-md border border-border bg-surface flex items-center justify-center text-muted hover:text-fg hover:border-border-strong transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6 lg:mx-0 lg:px-0 pb-1"
      >
        {reviews.map((r) => (
          <article
            key={r.id}
            className="snap-start shrink-0 w-[290px] sm:w-[360px] surface-card p-7 flex flex-col"
          >
            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: r.rating ?? 5 }).map((_, s) => (
                <Star key={s} className="w-4 h-4 text-brand-500 fill-brand-500" />
              ))}
            </div>
            <blockquote className="t-body text-fg flex-1">{r.quote}</blockquote>
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-bg text-sm font-semibold flex-shrink-0">
                {r.author_name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0">
                <div className="t-small text-fg">{r.author_name}</div>
                {r.author_role || r.author_company ? (
                  <div className="t-mono text-muted text-[11px] truncate">
                    {[r.author_role, r.author_company].filter(Boolean).join(" · ")}
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
