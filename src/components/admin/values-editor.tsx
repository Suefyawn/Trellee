"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  deleteValueAction,
  upsertValueAction,
} from "@/app/admin/_actions/wrappers";
import type { ValueRow } from "@/lib/types/database";

type Draft = {
  id?: string;
  title: string;
  description: string;
  icon: string;
  display_order: number;
};

export function ValuesEditor({ initial }: { initial: ValueRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Draft[]>(
    initial.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      icon: v.icon ?? "",
      display_order: v.display_order,
    })),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(idx: number, patch: Partial<Draft>) {
    setItems((arr) => {
      const next = arr.slice();
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }
  function add() {
    setItems((arr) => [
      ...arr,
      { title: "", description: "", icon: "", display_order: arr.length + 1 },
    ]);
  }
  function save(idx: number) {
    const it = items[idx];
    setError(null);
    if (!it.title.trim() || !it.description.trim())
      return setError("Title + description required.");
    startTransition(async () => {
      const res = await upsertValueAction({
        id: it.id,
        title: it.title,
        description: it.description,
        icon: it.icon || undefined,
        display_order: it.display_order,
      });
      if (!res.ok) return setError(res.error ?? "Could not save.");
      router.refresh();
    });
  }
  function remove(idx: number) {
    const it = items[idx];
    if (!it.id) return setItems((arr) => arr.filter((_, i) => i !== idx));
    startTransition(async () => {
      const res = await deleteValueAction(it.id!);
      if (!res.ok) return setError(res.error ?? "Could not delete.");
      setItems((arr) => arr.filter((_, i) => i !== idx));
      router.refresh();
    });
  }

  return (
    <div className="surface-card p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h2 className="t-heading-l font-display">Values</h2>
        <button type="button" onClick={add} className="btn btn-secondary btn-sm">
          <Plus className="w-3.5 h-3.5" /> Add value
        </button>
      </div>
      {error ? <p className="t-small text-danger mt-3">{error}</p> : null}
      <div className="mt-6 space-y-3">
        {items.map((it, idx) => (
          <div
            key={it.id ?? idx}
            className="rounded-lg border border-border bg-surface-2/40 p-4 grid md:grid-cols-12 gap-3"
          >
            <label className="block md:col-span-3">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Title
              </span>
              <input
                className="input mt-1.5"
                value={it.title}
                onChange={(e) => update(idx, { title: e.target.value })}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Icon (Lucide)
              </span>
              <input
                className="input mt-1.5"
                value={it.icon}
                onChange={(e) => update(idx, { icon: e.target.value })}
              />
            </label>
            <label className="block md:col-span-6">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Description
              </span>
              <textarea
                rows={2}
                className="textarea mt-1.5"
                value={it.description}
                onChange={(e) => update(idx, { description: e.target.value })}
              />
            </label>
            <label className="block md:col-span-1">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Order
              </span>
              <input
                type="number"
                className="input mt-1.5"
                value={it.display_order}
                onChange={(e) =>
                  update(idx, { display_order: Number(e.target.value) })
                }
              />
            </label>
            <div className="md:col-span-12 flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => remove(idx)}
                disabled={pending}
                className="btn btn-ghost btn-sm text-muted hover:text-danger"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => save(idx)}
                disabled={pending}
                className="btn btn-primary btn-sm"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
