"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  deleteActivityAction,
  upsertActivityAction,
} from "@/app/admin/_actions/wrappers";
import type { ActivityFeedRow } from "@/lib/types/database";
import { timeAgo } from "@/lib/utils";

type Draft = {
  id?: string;
  message: string;
  badge: string;
  href: string;
  occurred_at: string;
};

export function ActivityEditor({ initial }: { initial: ActivityFeedRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Draft[]>(
    initial.map((a) => ({
      id: a.id,
      message: a.message,
      badge: a.badge ?? "",
      href: a.href ?? "",
      occurred_at: a.occurred_at.slice(0, 16),
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
      {
        message: "",
        badge: "deploy",
        href: "",
        occurred_at: new Date().toISOString().slice(0, 16),
      },
      ...arr,
    ]);
  }
  function save(idx: number) {
    const it = items[idx];
    setError(null);
    if (!it.message.trim()) return setError("Message required.");
    startTransition(async () => {
      const res = await upsertActivityAction({
        id: it.id,
        message: it.message,
        badge: it.badge || undefined,
        href: it.href || undefined,
        occurred_at: it.occurred_at
          ? new Date(it.occurred_at).toISOString()
          : undefined,
      });
      if (!res.ok) return setError(res.error ?? "Could not save.");
      router.refresh();
    });
  }
  function remove(idx: number) {
    const it = items[idx];
    if (!it.id) return setItems((arr) => arr.filter((_, i) => i !== idx));
    startTransition(async () => {
      const res = await deleteActivityAction(it.id!);
      if (!res.ok) return setError(res.error ?? "Could not delete.");
      setItems((arr) => arr.filter((_, i) => i !== idx));
      router.refresh();
    });
  }

  return (
    <div className="surface-card p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h2 className="t-heading-l font-display">Activity entries</h2>
        <button type="button" onClick={add} className="btn btn-secondary btn-sm">
          <Plus className="w-3.5 h-3.5" /> New entry
        </button>
      </div>
      {error ? <p className="t-small text-danger mt-3">{error}</p> : null}
      <div className="mt-6 space-y-3">
        {items.map((it, idx) => (
          <div
            key={it.id ?? idx}
            className="rounded-lg border border-border bg-surface-2/40 p-4 grid md:grid-cols-12 gap-3"
          >
            <label className="block md:col-span-6">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Message
              </span>
              <input
                className="input mt-1.5"
                value={it.message}
                placeholder="Shipped v2.4.1 for Northside · CRM deal-sync"
                onChange={(e) => update(idx, { message: e.target.value })}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Badge
              </span>
              <input
                className="input mt-1.5"
                value={it.badge}
                placeholder="deploy"
                onChange={(e) => update(idx, { badge: e.target.value })}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Link (optional)
              </span>
              <input
                className="input mt-1.5"
                value={it.href}
                onChange={(e) => update(idx, { href: e.target.value })}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Occurred
              </span>
              <input
                type="datetime-local"
                className="input mt-1.5"
                value={it.occurred_at}
                onChange={(e) => update(idx, { occurred_at: e.target.value })}
              />
              {it.id ? (
                <p className="t-mono text-muted text-[10px] mt-1">
                  {timeAgo(it.occurred_at)}
                </p>
              ) : null}
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
