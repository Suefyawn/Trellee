"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { upsertInvoiceAction } from "@/app/admin/_actions/wrappers";
import type { InvoiceLineItem, InvoiceRow } from "@/lib/types/database";
import { Field, Section } from "./ui";

const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "CAD", "AUD"];
const today = () => new Date().toISOString().slice(0, 10);

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function InvoiceForm({ initial }: { initial?: InvoiceRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    status: initial?.status ?? ("draft" as const),
    client_name: initial?.client_name ?? "",
    client_company: initial?.client_company ?? "",
    client_email: initial?.client_email ?? "",
    client_address: initial?.client_address ?? "",
    issue_date: initial?.issue_date ?? today(),
    due_date: initial?.due_date ?? "",
    currency: initial?.currency ?? "USD",
    tax_rate: initial?.tax_rate ?? 0,
    notes: initial?.notes ?? "",
  });
  const [items, setItems] = useState<InvoiceLineItem[]>(
    initial?.line_items?.length
      ? initial.line_items
      : [{ description: "", quantity: 1, unit_price: 0 }],
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setItem(i: number, patch: Partial<InvoiceLineItem>) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  const subtotal = useMemo(
    () =>
      items.reduce(
        (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
        0,
      ),
    [items],
  );
  const taxAmount = subtotal * ((Number(form.tax_rate) || 0) / 100);
  const total = subtotal + taxAmount;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const res = await upsertInvoiceAction({
        id: initial?.id,
        status: form.status,
        client_name: form.client_name.trim(),
        client_email: form.client_email || undefined,
        client_company: form.client_company || undefined,
        client_address: form.client_address || undefined,
        issue_date: form.issue_date,
        due_date: form.due_date || undefined,
        currency: form.currency,
        tax_rate: Number(form.tax_rate) || 0,
        notes: form.notes || undefined,
        line_items: items
          .filter((it) => it.description.trim())
          .map((it) => ({
            description: it.description.trim(),
            quantity: Number(it.quantity) || 0,
            unit_price: Number(it.unit_price) || 0,
          })),
      });
      if (!res.ok) {
        setErr(res.error ?? "Could not save.");
        return;
      }
      if (!initial?.id && res.id) router.push(`/admin/invoices/${res.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Bill to">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Client name">
            <input
              className="input"
              required
              value={form.client_name}
              onChange={(e) => set("client_name", e.target.value)}
            />
          </Field>
          <Field label="Company (optional)">
            <input
              className="input"
              value={form.client_company}
              onChange={(e) => set("client_company", e.target.value)}
            />
          </Field>
          <Field label="Email (optional)">
            <input
              type="email"
              className="input"
              value={form.client_email}
              onChange={(e) => set("client_email", e.target.value)}
            />
          </Field>
          <Field label="Billing address (optional)">
            <textarea
              className="textarea"
              rows={2}
              value={form.client_address}
              onChange={(e) => set("client_address", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Details">
        <div className="grid md:grid-cols-4 gap-4">
          <Field label="Issue date">
            <input
              type="date"
              className="input"
              required
              value={form.issue_date}
              onChange={(e) => set("issue_date", e.target.value)}
            />
          </Field>
          <Field label="Due date (optional)">
            <input
              type="date"
              className="input"
              value={form.due_date}
              onChange={(e) => set("due_date", e.target.value)}
            />
          </Field>
          <Field label="Currency">
            <select
              className="select"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className="select"
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value as typeof form.status)
              }
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="void">Void</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Line items">
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 md:col-span-6">
                <Field label={i === 0 ? "Description" : ""}>
                  <input
                    className="input"
                    placeholder="e.g. Website design & build"
                    value={it.description}
                    onChange={(e) => setItem(i, { description: e.target.value })}
                  />
                </Field>
              </div>
              <div className="col-span-4 md:col-span-2">
                <Field label={i === 0 ? "Qty" : ""}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="input"
                    value={it.quantity}
                    onChange={(e) =>
                      setItem(i, { quantity: Number(e.target.value) })
                    }
                  />
                </Field>
              </div>
              <div className="col-span-5 md:col-span-3">
                <Field label={i === 0 ? "Unit price" : ""}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="input"
                    value={it.unit_price}
                    onChange={(e) =>
                      setItem(i, { unit_price: Number(e.target.value) })
                    }
                  />
                </Field>
              </div>
              <div className="col-span-3 md:col-span-1">
                <button
                  type="button"
                  aria-label="Remove line"
                  className="btn btn-ghost w-full"
                  onClick={() =>
                    setItems((arr) =>
                      arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr,
                    )
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setItems((arr) => [...arr, { description: "", quantity: 1, unit_price: 0 }])
            }
          >
            <Plus className="w-4 h-4" /> Add line
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-border flex justify-end">
          <div className="w-full max-w-xs space-y-2 t-small">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{money(subtotal, form.currency)}</span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span className="flex items-center gap-2">
                Tax
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="input w-16 py-1"
                  value={form.tax_rate}
                  onChange={(e) => set("tax_rate", Number(e.target.value) as never)}
                />
                %
              </span>
              <span>{money(taxAmount, form.currency)}</span>
            </div>
            <div className="flex justify-between font-display text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span>{money(total, form.currency)}</span>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Notes">
        <Field label="Notes / payment terms (optional)">
          <textarea
            className="textarea"
            rows={3}
            placeholder="e.g. Payment due within 14 days. Bank transfer details…"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
      </Section>

      {err ? <p className="t-small text-danger">{err}</p> : null}

      <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
        <Save className="w-4 h-4" />
        {pending ? "Saving…" : initial?.id ? "Save changes" : "Create invoice"}
      </button>
    </form>
  );
}
