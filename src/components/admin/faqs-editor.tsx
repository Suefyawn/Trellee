"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { deleteFAQAction, upsertFAQAction } from "@/app/admin/_actions/wrappers";
import type { FAQRow } from "@/lib/types/database";

type Draft = {
  id?: string;
  question: string;
  answer: string;
  display_order: number;
};

export function FAQsEditor({
  serviceId,
  category,
  initial,
}: {
  serviceId?: string;
  category?: string;
  initial: FAQRow[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Draft[]>(
    initial.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      display_order: f.display_order,
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
      { question: "", answer: "", display_order: arr.length + 1 },
    ]);
  }
  function save(idx: number) {
    const it = items[idx];
    setError(null);
    if (!it.question.trim() || !it.answer.trim()) {
      setError("Question and answer required.");
      return;
    }
    startTransition(async () => {
      const res = await upsertFAQAction({
        id: it.id,
        question: it.question,
        answer: it.answer,
        category,
        service_id: serviceId,
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
      const res = await deleteFAQAction(it.id!);
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
        <div>
          <h2 className="t-heading-l font-display">FAQs</h2>
          <p className="t-small text-muted mt-1">
            Appear in the FAQ accordion on the detail page.
          </p>
        </div>
        <button type="button" onClick={add} className="btn btn-secondary btn-sm">
          <Plus className="w-3.5 h-3.5" /> Add FAQ
        </button>
      </div>

      {error ? <p className="t-small text-danger mt-3">{error}</p> : null}

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <p className="t-small text-muted">No FAQs yet.</p>
        ) : null}
        {items.map((it, idx) => (
          <div
            key={it.id ?? idx}
            className="rounded-lg border border-border bg-surface-2/40 p-4 space-y-3"
          >
            <input
              className="input"
              placeholder="Question"
              value={it.question}
              onChange={(e) => update(idx, { question: e.target.value })}
            />
            <textarea
              className="textarea"
              rows={3}
              placeholder="Answer (plain text or simple markdown)"
              value={it.answer}
              onChange={(e) => update(idx, { answer: e.target.value })}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                  Order
                </span>
                <input
                  type="number"
                  className="input w-20"
                  value={it.display_order}
                  onChange={(e) =>
                    update(idx, { display_order: Number(e.target.value) })
                  }
                />
              </label>
              <div className="flex items-center gap-2">
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
          </div>
        ))}
      </div>
    </div>
  );
}
