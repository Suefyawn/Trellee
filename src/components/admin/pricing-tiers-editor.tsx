"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  deletePricingTierAction,
  upsertPricingTierAction,
} from "@/app/admin/_actions/wrappers";
import type { PricingTierRow } from "@/lib/types/database";

type Draft = {
  id?: string;
  name: string;
  price: string;
  price_suffix: string;
  description: string;
  features: string;
  highlighted: boolean;
  cta_label: string;
  cta_href: string;
  display_order: number;
};

function rowToDraft(row: PricingTierRow): Draft {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    price_suffix: row.price_suffix ?? "",
    description: row.description ?? "",
    features: row.features.join("\n"),
    highlighted: row.highlighted,
    cta_label: row.cta_label,
    cta_href: row.cta_href,
    display_order: row.display_order,
  };
}

export function PricingTiersEditor({
  serviceId,
  initial,
}: {
  serviceId: string;
  initial: PricingTierRow[];
}) {
  const router = useRouter();
  const [tiers, setTiers] = useState<Draft[]>(initial.map(rowToDraft));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(idx: number, patch: Partial<Draft>) {
    setTiers((arr) => {
      const next = arr.slice();
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function addTier() {
    setTiers((arr) => [
      ...arr,
      {
        name: "New tier",
        price: "$0",
        price_suffix: "/project",
        description: "",
        features: "",
        highlighted: false,
        cta_label: "Book a call",
        cta_href: "/book",
        display_order: arr.length + 1,
      },
    ]);
  }

  function save(idx: number) {
    const t = tiers[idx];
    setError(null);
    startTransition(async () => {
      const res = await upsertPricingTierAction({
        id: t.id,
        service_id: serviceId,
        name: t.name,
        price: t.price,
        price_suffix: t.price_suffix || undefined,
        description: t.description || undefined,
        features: t.features.split("\n").map((f) => f.trim()).filter(Boolean),
        highlighted: t.highlighted,
        cta_label: t.cta_label,
        cta_href: t.cta_href,
        display_order: t.display_order,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save tier.");
        return;
      }
      router.refresh();
    });
  }

  function remove(idx: number) {
    const t = tiers[idx];
    if (!t.id) {
      setTiers((arr) => arr.filter((_, i) => i !== idx));
      return;
    }
    startTransition(async () => {
      const res = await deletePricingTierAction(t.id!);
      if (!res.ok) {
        setError(res.error ?? "Could not delete.");
        return;
      }
      setTiers((arr) => arr.filter((_, i) => i !== idx));
      router.refresh();
    });
  }

  return (
    <div className="surface-card p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="t-heading-l font-display">Pricing tiers</h2>
          <p className="t-small text-muted mt-1">
            Shown on the service detail page. Mark one as highlighted to draw the eye.
          </p>
        </div>
        <button type="button" onClick={addTier} className="btn btn-secondary btn-sm">
          <Plus className="w-3.5 h-3.5" /> Add tier
        </button>
      </div>

      {error ? <p className="t-small text-danger mt-3">{error}</p> : null}

      <div className="mt-6 space-y-4">
        {tiers.length === 0 ? (
          <p className="t-small text-muted">
            No tiers yet — clients will see a generic CTA instead.
          </p>
        ) : null}

        {tiers.map((t, idx) => (
          <div
            key={t.id ?? idx}
            className="rounded-lg border border-border bg-surface-2/40 p-4"
          >
            <div className="grid md:grid-cols-3 gap-3">
              <label className="block">
                <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                  Name
                </span>
                <input
                  className="input mt-1.5"
                  value={t.name}
                  onChange={(e) => update(idx, { name: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                  Price
                </span>
                <input
                  className="input mt-1.5"
                  value={t.price}
                  onChange={(e) => update(idx, { price: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                  Price suffix
                </span>
                <input
                  className="input mt-1.5"
                  value={t.price_suffix}
                  placeholder="/project"
                  onChange={(e) => update(idx, { price_suffix: e.target.value })}
                />
              </label>
              <label className="block md:col-span-3">
                <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                  Description
                </span>
                <textarea
                  rows={2}
                  className="textarea mt-1.5"
                  value={t.description}
                  onChange={(e) => update(idx, { description: e.target.value })}
                />
              </label>
              <label className="block md:col-span-3">
                <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                  Features (one per line)
                </span>
                <textarea
                  rows={5}
                  className="textarea mt-1.5"
                  value={t.features}
                  onChange={(e) => update(idx, { features: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                  CTA label
                </span>
                <input
                  className="input mt-1.5"
                  value={t.cta_label}
                  onChange={(e) => update(idx, { cta_label: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                  CTA href
                </span>
                <input
                  className="input mt-1.5"
                  value={t.cta_href}
                  onChange={(e) => update(idx, { cta_href: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="t-mono text-muted text-[10px] uppercase tracking-wider">
                  Order
                </span>
                <input
                  type="number"
                  className="input mt-1.5"
                  value={t.display_order}
                  onChange={(e) =>
                    update(idx, { display_order: Number(e.target.value) })
                  }
                />
              </label>
              <label className="flex items-center gap-2 md:col-span-3 mt-1">
                <input
                  type="checkbox"
                  className="check"
                  checked={t.highlighted}
                  onChange={(e) => update(idx, { highlighted: e.target.checked })}
                />
                <span className="t-small text-muted">Highlighted (most picked)</span>
              </label>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => remove(idx)}
                disabled={pending}
                className="btn btn-ghost btn-sm text-muted hover:text-danger"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
              <button
                type="button"
                onClick={() => save(idx)}
                disabled={pending}
                className="btn btn-primary btn-sm"
              >
                <Save className="w-3.5 h-3.5" />
                {t.id ? "Save changes" : "Create tier"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
