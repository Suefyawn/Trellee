"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { upsertPmProjectAction } from "@/app/admin/_actions/wrappers";
import type { PmProjectRow } from "@/lib/types/database";
import { Field, Section } from "./ui";

export function PmProjectForm({ initial }: { initial?: PmProjectRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    client_name: initial?.client_name ?? "",
    client_email: initial?.client_email ?? "",
    status: initial?.status ?? ("active" as const),
    description: initial?.description ?? "",
    due_date: initial?.due_date ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    startTransition(async () => {
      const res = await upsertPmProjectAction({
        id: initial?.id,
        name: form.name.trim(),
        client_name: form.client_name || undefined,
        client_email: form.client_email || undefined,
        status: form.status,
        description: form.description || undefined,
        due_date: form.due_date || undefined,
      });
      if (!res.ok) {
        setErr(res.error ?? "Could not save.");
        return;
      }
      setSaved(true);
      if (!initial?.id && res.id) router.push(`/admin/pm/${res.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Project">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Project name" className="md:col-span-2">
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label="Client name">
            <input
              className="input"
              value={form.client_name}
              onChange={(e) => set("client_name", e.target.value)}
            />
          </Field>
          <Field label="Client email">
            <input
              type="email"
              className="input"
              value={form.client_email}
              onChange={(e) => set("client_email", e.target.value)}
            />
          </Field>
          <Field label="Status">
            <select
              className="select"
              value={form.status}
              onChange={(e) => set("status", e.target.value as typeof form.status)}
            >
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="done">Done</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Due date (optional)">
            <input
              type="date"
              className="input"
              value={form.due_date}
              onChange={(e) => set("due_date", e.target.value)}
            />
          </Field>
          <Field label="Description / scope" className="md:col-span-2">
            <textarea
              className="textarea"
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {err ? <p className="t-small text-danger">{err}</p> : null}
      {saved ? <p className="t-small text-brand-500">Saved.</p> : null}

      <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
        <Save className="w-4 h-4" />
        {pending ? "Saving…" : initial?.id ? "Save changes" : "Create project"}
      </button>
    </form>
  );
}
