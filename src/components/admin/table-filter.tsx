"use client";

import { useState } from "react";
import { Search } from "lucide-react";

/**
 * Lightweight client-side filter for admin list tables. Filters elements
 * marked `data-row` inside the container with id={targetId} by text content.
 * No data restructuring needed: the server page just tags its rows.
 */
export function TableFilter({
  targetId,
  placeholder = "Filter…",
}: {
  targetId: string;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");

  function onChange(value: string) {
    setQ(value);
    const term = value.trim().toLowerCase();
    const root = document.getElementById(targetId);
    if (!root) return;
    let shown = 0;
    root.querySelectorAll<HTMLElement>("[data-row]").forEach((el) => {
      const match = !term || (el.textContent ?? "").toLowerCase().includes(term);
      el.style.display = match ? "" : "none";
      if (match) shown += 1;
    });
    const empty = document.getElementById(`${targetId}-empty`);
    if (empty) empty.style.display = shown === 0 && term ? "" : "none";
  }

  return (
    <div className="relative">
      <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="search"
        value={q}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="input pl-9 py-2 w-full sm:w-56"
      />
    </div>
  );
}
