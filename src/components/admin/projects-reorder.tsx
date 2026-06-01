"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { GripVertical, Search } from "lucide-react";
import { reorderProjectsAction } from "@/app/admin/_actions/wrappers";
import type { ProjectRow } from "@/lib/types/database";

/**
 * Drag-to-reorder list for case studies. Order = featured_order, which drives
 * the homepage "selected work" + the /portfolio order. Includes a search box;
 * reordering is disabled while a filter is active (so indices stay meaningful).
 */
export function ProjectsReorder({ projects }: { projects: ProjectRow[] }) {
  const [items, setItems] = useState<ProjectRow[]>(projects);
  const [query, setQuery] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const q = query.trim().toLowerCase();
  const filtering = q.length > 0;
  const match = (p: ProjectRow) =>
    !q ||
    `${p.title} ${p.client_name ?? ""} ${p.service_categories.join(" ")} ${p.status}`
      .toLowerCase()
      .includes(q);
  const visibleCount = items.filter(match).length;

  function handleDrop(targetId: string) {
    setOverId(null);
    if (filtering || !dragId || dragId === targetId) return;
    const from = items.findIndex((i) => i.id === dragId);
    const to = items.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setDragId(null);
    setSaved(false);
    startTransition(async () => {
      await reorderProjectsAction(next.map((i) => i.id));
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter projects…"
            aria-label="Filter projects"
            className="input pl-9 py-2 w-full sm:w-64"
          />
        </div>
        <span className="t-mono text-muted text-xs">
          {pending
            ? "Saving order…"
            : saved
              ? "Order saved."
              : filtering
                ? "Clear filter to reorder"
                : "Drag rows to reorder"}
        </span>
      </div>

      <div className="surface-card divide-y divide-border">
        {items.map((p, idx) => (
          <div
            key={p.id}
            draggable={!filtering}
            onDragStart={() => setDragId(p.id)}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!filtering) setOverId(p.id);
            }}
            onDrop={() => handleDrop(p.id)}
            style={{ display: match(p) ? undefined : "none" }}
            className={`flex items-center gap-3 p-4 transition ${
              dragId === p.id ? "opacity-40" : ""
            } ${overId === p.id && dragId !== p.id ? "bg-surface-2/60" : ""}`}
          >
            <GripVertical
              className={`w-4 h-4 shrink-0 ${
                filtering ? "text-muted/30" : "text-muted cursor-grab"
              }`}
            />
            <span className="t-mono text-muted text-xs w-5 shrink-0">{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <Link
                href={`/admin/projects/${p.id}`}
                draggable={false}
                className="text-fg hover:text-brand-500 transition"
              >
                {p.title}
              </Link>
              <div className="t-mono text-muted text-xs truncate">
                {p.client_name ?? "—"}
              </div>
            </div>
            <span
              className={`badge text-[9px] shrink-0 ${
                p.status === "published" ? "badge-brand" : ""
              }`}
            >
              {p.status}
            </span>
            {p.featured ? (
              <span className="badge badge-brand text-[9px] shrink-0">featured</span>
            ) : null}
          </div>
        ))}
        {filtering && visibleCount === 0 ? (
          <div className="p-4 t-small text-muted">No matches.</div>
        ) : null}
      </div>
    </div>
  );
}
