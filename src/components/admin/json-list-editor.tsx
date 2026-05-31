"use client";

import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";

type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea";
  placeholder?: string;
};

/**
 * Repeater editor for arrays of records (e.g. approach pillars, deliverables,
 * project metrics). Renders each row as a card with the configured fields.
 */
export function JsonListEditor<T extends Record<string, unknown>>({
  fields,
  value,
  onChange,
  newItem,
  emptyLabel,
}: {
  fields: FieldDef[];
  value: T[];
  onChange: (next: T[]) => void;
  newItem: T;
  emptyLabel: string;
}) {
  function set(idx: number, key: string, val: string) {
    const next = value.slice();
    next[idx] = { ...next[idx], [key]: val };
    onChange(next);
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...value, { ...newItem }]);
  }
  function move(idx: number, delta: number) {
    const j = idx + delta;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="t-small text-muted">No items yet.</p>
      ) : (
        value.map((item, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-border bg-surface-2/40 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="t-mono text-muted text-xs">#{idx + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  className="p-1.5 rounded hover:bg-surface-2 text-muted hover:text-fg transition"
                  aria-label="Move up"
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  className="p-1.5 rounded hover:bg-surface-2 text-muted hover:text-fg transition"
                  aria-label="Move down"
                >
                  <MoveDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="p-1.5 rounded hover:bg-danger/10 text-muted hover:text-danger transition"
                  aria-label="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {fields.map((f) => (
                <label key={f.key} className="block sm:col-span-2 first:col-span-1">
                  <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                    {f.label}
                  </span>
                  {f.type === "textarea" ? (
                    <textarea
                      rows={2}
                      className="textarea mt-1.5"
                      value={String(item[f.key] ?? "")}
                      placeholder={f.placeholder}
                      onChange={(e) => set(idx, f.key, e.target.value)}
                    />
                  ) : (
                    <input
                      className="input mt-1.5"
                      value={String(item[f.key] ?? "")}
                      placeholder={f.placeholder}
                      onChange={(e) => set(idx, f.key, e.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))
      )}
      <button
        type="button"
        onClick={add}
        className="btn btn-secondary btn-sm w-full justify-center"
      >
        <Plus className="w-3.5 h-3.5" /> {emptyLabel}
      </button>
    </div>
  );
}
