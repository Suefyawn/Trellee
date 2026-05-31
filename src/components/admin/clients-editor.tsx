"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  deleteClientAction,
  upsertClientAction,
} from "@/app/admin/_actions/wrappers";
import type { ClientRow } from "@/lib/types/database";

type Draft = {
  id?: string;
  name: string;
  logo_url: string;
  website_url: string;
  featured: boolean;
  display_order: number;
};

export function ClientsEditor({ initial }: { initial: ClientRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Draft[]>(
    initial.map((c) => ({
      id: c.id,
      name: c.name,
      logo_url: c.logo_url ?? "",
      website_url: c.website_url ?? "",
      featured: c.featured,
      display_order: c.display_order,
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
      {
        name: "",
        logo_url: "",
        website_url: "",
        featured: true,
        display_order: arr.length + 1,
      },
    ]);
  }
  function save(idx: number) {
    const it = items[idx];
    setError(null);
    if (!it.name.trim()) {
      setError("Name is required.");
      return;
    }
    startTransition(async () => {
      const res = await upsertClientAction({
        id: it.id,
        name: it.name,
        logo_url: it.logo_url || undefined,
        website_url: it.website_url || undefined,
        featured: it.featured,
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
      const res = await deleteClientAction(it.id!);
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
        <h2 className="t-heading-l font-display">Clients</h2>
        <button type="button" onClick={add} className="btn btn-secondary btn-sm">
          <Plus className="w-3.5 h-3.5" /> Add client
        </button>
      </div>
      {error ? <p className="t-small text-danger mt-3">{error}</p> : null}
      <div className="mt-6 space-y-3">
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
                onChange={(e) => update(idx, { name: e.target.value })}
              />
            </label>
            <label className="block md:col-span-3">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Logo URL
              </span>
              <input
                className="input mt-1.5"
                value={it.logo_url}
                onChange={(e) => update(idx, { logo_url: e.target.value })}
                placeholder="https://…"
              />
            </label>
            <label className="block md:col-span-3">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Website
              </span>
              <input
                className="input mt-1.5"
                value={it.website_url}
                onChange={(e) => update(idx, { website_url: e.target.value })}
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
            <label className="md:col-span-1 flex items-center gap-2">
              <input
                type="checkbox"
                className="check"
                checked={it.featured}
                onChange={(e) => update(idx, { featured: e.target.checked })}
              />
              <span className="t-mono text-muted text-xs">Featured</span>
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
                <Save className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
