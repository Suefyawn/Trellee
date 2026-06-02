"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  deleteTeamMemberAction,
  upsertTeamMemberAction,
} from "@/app/admin/_actions/wrappers";
import type { TeamMemberRow } from "@/lib/types/database";
import { ImageUpload } from "./image-upload";

type Draft = {
  id?: string;
  name: string;
  role: string;
  bio: string;
  avatar_url: string;
  display_order: number;
  active: boolean;
};

export function TeamEditor({ initial }: { initial: TeamMemberRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Draft[]>(
    initial.map((t) => ({
      id: t.id,
      name: t.name,
      role: t.role ?? "",
      bio: t.bio ?? "",
      avatar_url: t.avatar_url ?? "",
      display_order: t.display_order,
      active: t.active,
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
        role: "",
        bio: "",
        avatar_url: "",
        display_order: arr.length + 1,
        active: true,
      },
    ]);
  }
  function save(idx: number) {
    const it = items[idx];
    setError(null);
    if (!it.name.trim()) return setError("Name required.");
    startTransition(async () => {
      const res = await upsertTeamMemberAction({
        id: it.id,
        name: it.name,
        role: it.role || undefined,
        bio: it.bio || undefined,
        avatar_url: it.avatar_url || undefined,
        display_order: it.display_order,
        active: it.active,
      });
      if (!res.ok) return setError(res.error ?? "Could not save.");
      router.refresh();
    });
  }
  function remove(idx: number) {
    const it = items[idx];
    if (!it.id) return setItems((arr) => arr.filter((_, i) => i !== idx));
    startTransition(async () => {
      const res = await deleteTeamMemberAction(it.id!);
      if (!res.ok) return setError(res.error ?? "Could not delete.");
      setItems((arr) => arr.filter((_, i) => i !== idx));
      router.refresh();
    });
  }

  return (
    <div className="surface-card p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h2 className="t-heading-l font-display">Team members</h2>
        <button type="button" onClick={add} className="btn btn-secondary btn-sm">
          <Plus className="w-3.5 h-3.5" /> Add member
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
                Role
              </span>
              <input
                className="input mt-1.5"
                value={it.role}
                onChange={(e) => update(idx, { role: e.target.value })}
              />
            </label>
            <div className="block md:col-span-4">
              <ImageUpload
                label="Avatar"
                rounded
                value={it.avatar_url}
                onChange={(url) => update(idx, { avatar_url: url })}
              />
            </div>
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
                checked={it.active}
                onChange={(e) => update(idx, { active: e.target.checked })}
              />
              <span className="t-mono text-muted text-xs">Active</span>
            </label>
            <label className="block md:col-span-12">
              <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                Bio
              </span>
              <textarea
                rows={2}
                className="textarea mt-1.5"
                value={it.bio}
                onChange={(e) => update(idx, { bio: e.target.value })}
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
                <Save className="w-3.5 h-3.5" /> {it.id ? "Save" : "Create"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
