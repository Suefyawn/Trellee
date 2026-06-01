"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import { reorderServicesAction } from "@/app/admin/_actions/wrappers";
import type { ServiceRow } from "@/lib/types/database";

/**
 * Drag-to-reorder list for services. Order controls the homepage bento and the
 * /services page. Saves automatically on drop. Drag is a desktop enhancement;
 * the numeric "display order" field in each editor remains the touch fallback.
 */
export function ServicesReorder({ services }: { services: ServiceRow[] }) {
  const [items, setItems] = useState<ServiceRow[]>(services);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleDrop(targetId: string) {
    setOverId(null);
    if (!dragId || dragId === targetId) return;
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
      await reorderServicesAction(next.map((i) => i.id));
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    });
  }

  return (
    <div className="surface-card divide-y divide-border">
      {items.map((s, idx) => (
        <div
          key={s.id}
          draggable
          onDragStart={() => setDragId(s.id)}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOverId(s.id);
          }}
          onDrop={() => handleDrop(s.id)}
          className={`flex items-center gap-3 p-4 transition ${
            dragId === s.id ? "opacity-40" : ""
          } ${overId === s.id && dragId !== s.id ? "bg-surface-2/60" : ""}`}
        >
          <GripVertical className="w-4 h-4 text-muted cursor-grab shrink-0" />
          <span className="t-mono text-muted text-xs w-5 shrink-0">{idx + 1}</span>
          <div className="flex-1 min-w-0">
            <Link
              href={`/admin/services/${s.id}`}
              className="text-fg hover:text-brand-500 transition"
              draggable={false}
            >
              {s.title}
            </Link>
            <div className="t-mono text-muted text-xs truncate">
              {(s.category ?? "—") + " · tile " + s.tile_size}
            </div>
          </div>
          {s.featured ? (
            <span className="badge badge-brand text-[9px] shrink-0">featured</span>
          ) : null}
        </div>
      ))}
      <div className="p-3 t-mono text-muted text-xs">
        {pending
          ? "Saving order…"
          : saved
            ? "Order saved."
            : "Drag rows to reorder. Saves automatically."}
      </div>
    </div>
  );
}
