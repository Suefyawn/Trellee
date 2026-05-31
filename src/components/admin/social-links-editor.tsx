"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  deleteSocialLinkAction,
  upsertSocialLinkAction,
} from "@/app/admin/_actions/wrappers";
import type { SocialLinkRow } from "@/lib/types/database";

type Draft = {
  id?: string;
  platform: string;
  url: string;
  display_order: number;
};

const PLATFORMS = ["x", "linkedin", "github", "instagram", "youtube"];

export function SocialLinksEditor({ initial }: { initial: SocialLinkRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Draft[]>(
    initial.map((s) => ({
      id: s.id,
      platform: s.platform,
      url: s.url,
      display_order: s.display_order,
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
      { platform: "x", url: "", display_order: arr.length + 1 },
    ]);
  }
  function save(idx: number) {
    const it = items[idx];
    setError(null);
    if (!it.url.trim()) return setError("URL required.");
    startTransition(async () => {
      const res = await upsertSocialLinkAction({
        id: it.id,
        platform: it.platform,
        url: it.url,
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
      const res = await deleteSocialLinkAction(it.id!);
      if (!res.ok) return setError(res.error ?? "Could not delete.");
      setItems((arr) => arr.filter((_, i) => i !== idx));
      router.refresh();
    });
  }

  return (
    <div className="surface-card p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h2 className="t-heading-l font-display">Social links</h2>
        <button type="button" onClick={add} className="btn btn-secondary btn-sm">
          <Plus className="w-3.5 h-3.5" /> Add link
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
                Platform
              </span>
              <select
                className="select mt-1.5"
                value={it.platform}
                onChange={(e) => update(idx, { platform: e.target.value })}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-7">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                URL
              </span>
              <input
                className="input mt-1.5"
                value={it.url}
                onChange={(e) => update(idx, { url: e.target.value })}
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
                <Save className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
