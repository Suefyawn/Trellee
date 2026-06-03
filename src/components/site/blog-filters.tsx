"use client";

import { useEffect, useState } from "react";
import type { BlogCategoryRow } from "@/lib/types/database";

/**
 * Client-side blog category filter. Shows/hides posts by their `data-cat`
 * attribute and reflects the choice in the URL (?category=) via the History
 * API — no navigation, so the page stays static/CDN-cached.
 */
export function BlogFilters({ categories }: { categories: BlogCategoryRow[] }) {
  const [active, setActive] = useState<string | null>(null);

  function apply(cat: string | null) {
    const root = document.getElementById("blog-list");
    if (!root) return;
    let shown = 0;
    root.querySelectorAll<HTMLElement>("[data-cat]").forEach((el) => {
      const match = !cat || el.dataset.cat === cat;
      el.style.display = match ? "" : "none";
      if (match) shown += 1;
    });
    const empty = document.getElementById("blog-empty");
    if (empty) empty.style.display = shown === 0 ? "" : "none";
  }

  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get("category");
    setActive(cat);
    apply(cat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function select(cat: string | null) {
    setActive(cat);
    apply(cat);
    window.history.replaceState(null, "", cat ? `/blog?category=${cat}` : "/blog");
  }

  const chip = (isActive: boolean) =>
    `px-3 py-1.5 rounded-md t-mono text-xs whitespace-nowrap transition ${
      isActive ? "bg-fg text-bg" : "text-muted hover:text-fg hover:bg-surface-2"
    }`;

  return (
    <section className="py-5 border-y border-border sticky top-16 z-30 backdrop-blur-md bg-bg/80">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button type="button" onClick={() => select(null)} className={chip(!active)}>
            All notes
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => select(c.slug)}
              className={chip(active === c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
