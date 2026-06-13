"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { ServiceRow } from "@/lib/types/database";
import { submitContact } from "@/app/actions/contact";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Honeypot, useFormGuard } from "./form-guard";

const BUDGETS = ["< $10k", "$10k-25k", "$25k-50k", "$50k-100k", "$100k+", "Not sure"];

export function ContactForm({ services }: { services: ServiceRow[] }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    budget: "",
    message: "",
  });
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const guard = useFormGuard();

  function toggleService(slug: string) {
    setPicked((arr) =>
      arr.includes(slug) ? arr.filter((s) => s !== slug) : [...arr, slug],
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitContact({
        name: form.name,
        email: form.email,
        company: form.company || undefined,
        budget: form.budget || undefined,
        services: picked,
        message: form.message,
        hp: guard.hp,
        elapsedMs: guard.elapsedMs(),
      });
      if (res.ok) {
        track("contact_submitted", {
          budget: form.budget || undefined,
          services: picked.length,
        });
        setSent(true);
      } else {
        setError(res.error);
      }
    });
  }

  if (sent) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/40 flex items-center justify-center mx-auto">
          <Check className="w-5 h-5 text-brand-500" />
        </div>
        <h3 className="t-heading-xl font-display mt-6">Message received.</h3>
        <p className="t-body text-muted mt-4 max-w-lg mx-auto">
          We&apos;ll be in touch at <span className="text-fg">{form.email}</span> within
          a business day. If it&apos;s urgent, drop us a WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="relative space-y-5">
      <Honeypot {...guard.honeypotProps} />
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="t-mono text-muted text-xs">Name</span>
          <input
            className="input mt-2"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="t-mono text-muted text-xs">Email</span>
          <input
            type="email"
            className="input mt-2"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="t-mono text-muted text-xs">Company</span>
          <input
            className="input mt-2"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          />
        </label>
      </div>

      <div>
        <span className="t-mono text-muted text-xs">What do you need help with?</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {services.map((s) => {
            const sel = picked.includes(s.slug);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleService(s.slug)}
                className={cn(
                  "px-3 py-1.5 rounded-md t-mono text-xs border transition",
                  sel
                    ? "bg-brand-500/20 border-brand-500/50 text-fg"
                    : "border-border text-muted hover:text-fg hover:border-border-strong",
                )}
              >
                {s.short_title ?? s.title}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="t-mono text-muted text-xs">Rough budget</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {BUDGETS.map((b) => {
            const sel = form.budget === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => setForm((f) => ({ ...f, budget: sel ? "" : b }))}
                className={cn(
                  "px-3 py-1.5 rounded-md t-mono text-xs border transition",
                  sel
                    ? "bg-fg text-bg border-fg"
                    : "border-border text-muted hover:text-fg hover:border-border-strong",
                )}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="t-mono text-muted text-xs">What&apos;s the brief?</span>
        <textarea
          className="textarea mt-2"
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="A few paragraphs about the project: context, audience, what success looks like, any constraints."
          required
        />
      </label>

      {error ? <p className="t-small text-danger">{error}</p> : null}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
        <p className="t-small text-muted max-w-md">
          We&apos;ll reply within a business day. No newsletter signup, no sequences.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-magnetic disabled:opacity-60 w-full sm:w-auto justify-center"
        >
          <span className="flex items-center gap-2">
            {pending ? "Sending…" : "Send the brief"}
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </form>
  );
}
