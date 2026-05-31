"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  deleteBlogCategoryAction,
  upsertBlogCategoryAction,
} from "@/app/admin/_actions/wrappers";
import type { BlogCategoryRow } from "@/lib/types/database";
import { slugify } from "@/lib/utils";

type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
};

export function CategoriesEditor({ initial }: { initial: BlogCategoryRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Draft[]>(
    initial.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      display_order: c.display_order,
    })),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(idx: number, patch: Partial<Draft>) {
    setItems((arr) => {
      const n = arr.slice();
      n[idx] = { ...n[idx], ...patch };
      return n;
    });
  }
  function add() {
    setItems((arr) => [
      ...arr,
      { name: "", slug: "", description: "", display_order: arr.length + 1 },
    ]);
  }
  function save(idx: number) {
    const it = items[idx];
    setError(null);
    if (!it.name.trim() || !it.slug.trim()) {
      setError("Name and slug are required.");
      return;
    }
    startTransition(async () => {
      const res = await upsertBlogCategoryAction({
        id: it.id,
        name: it.name,
        slug: slugify(it.slug),
        description: it.description || undefined,
        display_order: it.display_order,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save.");
        return;
      }
      router.refresh();
    });
  }
  function remove(idx: number) {
    const it = items[idx];
    if (!it.id) {
      setItems((arr) => arr.filter((_, i) => i !== idx));
      return;
    }
    startTransition(async () => {
      const res = await deleteBlogCategoryAction(it.id!);
      if (!res.ok) {
        setError(res.error ?? "Could not delete.");
        return;
      }
      setItems((arr) => arr.filter((_, i) => i !== idx));
      router.refresh();
    });
  }

  return (
    <div className="surface-card p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h2 className="t-heading-l font-display">Categories</h2>
        <button type="button" onClick={add} className="btn btn-secondary btn-sm">
          <Plus className="w-3.5 h-3.5" /> Add category
        </button>
      </div>
      {error ? <p className="t-small text-danger mt-3">{error}</p> : null}
      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <p className="t-small text-muted">No categories yet.</p>
        ) : null}
        {items.map((it, idx) => (
          <div
            key={it.id ?? idx}
            className="rounded-lg border border-border bg-surface-2/40 p-4 grid md:grid-cols-12 gap-3 items-end"
          >
            <label className="block md:col-span-3">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Name
              </span>
              <input
                className="input mt-1.5"
                value={it.name}
                onChange={(e) => {
                  update(idx, { name: e.target.value });
                  if (!it.id && !it.slug) update(idx, { slug: slugify(e.target.value) });
                }}
              />
            </label>
            <label className="block md:col-span-3">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Slug
              </span>
              <input
                className="input mt-1.5"
                value={it.slug}
                onChange={(e) => update(idx, { slug: e.target.value })}
              />
            </label>
            <label className="block md:col-span-4">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Description (optional)
              </span>
              <input
                className="input mt-1.5"
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
            <div className="md:col-span-1 flex items-center gap-1 justify-end">
              <button
                type="button"
                onClick={() => remove(idx)}
                disabled={pending}
                className="p-2 rounded hover:bg-danger/10 text-muted hover:text-danger transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => save(idx)}
                disabled={pending}
                className="btn btn-primary btn-sm"
              >
                <Save className="w-3.5 h-3.5" /> {it.id ? "Save" : "Add"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
