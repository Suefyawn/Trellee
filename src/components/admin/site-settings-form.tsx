"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { updateSiteSettingsAction } from "@/app/admin/_actions/wrappers";
import type { SiteSettingsRow } from "@/lib/types/database";
import { Field, Section } from "./ui";
import { JsonListEditor } from "./json-list-editor";

export function SiteSettingsForm({ initial }: { initial: SiteSettingsRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    company_name: initial.company_name,
    tagline: initial.tagline ?? "",
    email: initial.email ?? "",
    city: initial.city ?? "",
    whatsapp_url: initial.whatsapp_url ?? "",
    calendar_url: initial.calendar_url ?? "",
    response_time: initial.response_time ?? "",
    hero_eyebrow: initial.hero_eyebrow ?? "",
    hero_lede: initial.hero_lede ?? "",
    hero_body: initial.hero_body ?? "",
    hero_cta_label: initial.hero_cta_label ?? "",
    hero_cta_href: initial.hero_cta_href ?? "",
    ticker_words: initial.ticker_words.join("\n"),
    booking_quarter: initial.booking_quarter ?? "",
    booking_slots_open: initial.booking_slots_open ?? 4,
    cta_heading: initial.cta_heading ?? "",
    cta_subheading: initial.cta_subheading ?? "",
    cta_benefits: (initial.cta_benefits ?? []).join("\n"),
    newsletter_heading: initial.newsletter_heading ?? "",
    newsletter_subheading: initial.newsletter_subheading ?? "",
    about_hero_headline: initial.about_hero_headline ?? "",
    about_hero_subheadline: initial.about_hero_subheadline ?? "",
    about_origin_story: initial.about_origin_story ?? "",
    about_philosophy: initial.about_philosophy ?? "",
    contact_intro: initial.contact_intro ?? "",
  });

  const [stats, setStats] = useState(initial.stats);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateSiteSettingsAction({
        ...form,
        ticker_words: form.ticker_words
          .split(/\n+/)
          .map((s) => s.trim())
          .filter(Boolean),
        cta_benefits: form.cta_benefits
          .split(/\n+/)
          .map((s) => s.trim())
          .filter(Boolean),
        booking_slots_open: Number(form.booking_slots_open) || 0,
        stats,
      });
      if (!res.ok) {
        setErr(res.error ?? "Could not save.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Company">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Company name">
            <input
              className="input"
              value={form.company_name}
              onChange={(e) => set("company_name", e.target.value)}
            />
          </Field>
          <Field label="Tagline">
            <input
              className="input"
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              className="input"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="City">
            <input
              className="input"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>
          <Field label="WhatsApp URL">
            <input
              className="input"
              value={form.whatsapp_url}
              onChange={(e) => set("whatsapp_url", e.target.value)}
            />
          </Field>
          <Field label="Calendar URL (Calendly, Cal.com etc.)">
            <input
              className="input"
              value={form.calendar_url}
              onChange={(e) => set("calendar_url", e.target.value)}
            />
          </Field>
          <Field label="Response time copy" className="md:col-span-2">
            <input
              className="input"
              value={form.response_time}
              onChange={(e) => set("response_time", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Homepage hero">
        <Field label="Eyebrow">
          <input
            className="input"
            value={form.hero_eyebrow}
            onChange={(e) => set("hero_eyebrow", e.target.value)}
          />
        </Field>
        <Field label="Body (under headline)">
          <textarea
            className="textarea"
            rows={3}
            value={form.hero_body}
            onChange={(e) => set("hero_body", e.target.value)}
          />
        </Field>
        <Field
          label="Ticker words (one per line)"
          hint={`Cycles every ~1.9s. Currently ${form.ticker_words.split("\n").filter(Boolean).length}.`}
        >
          <textarea
            className="textarea font-mono"
            rows={6}
            value={form.ticker_words}
            onChange={(e) => set("ticker_words", e.target.value)}
          />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="CTA label">
            <input
              className="input"
              value={form.hero_cta_label}
              onChange={(e) => set("hero_cta_label", e.target.value)}
            />
          </Field>
          <Field label="CTA href">
            <input
              className="input"
              value={form.hero_cta_href}
              onChange={(e) => set("hero_cta_href", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Stats"
        description="Up to 4 stats shown on homepage CTA + about page."
      >
        <JsonListEditor
          fields={[
            { key: "label", label: "Label", type: "text" },
            { key: "value", label: "Value", type: "text" },
            { key: "suffix", label: "Suffix", type: "text", placeholder: "+, %, /5" },
            { key: "context", label: "Context", type: "text" },
          ]}
          value={stats}
          onChange={setStats}
          newItem={{ label: "", value: "", suffix: "", context: "" }}
          emptyLabel="Add stat"
        />
      </Section>

      <Section title="Booking CTA">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Booking quarter">
            <input
              className="input"
              value={form.booking_quarter}
              onChange={(e) => set("booking_quarter", e.target.value)}
            />
          </Field>
          <Field label="Slots open">
            <input
              type="number"
              className="input"
              value={form.booking_slots_open}
              onChange={(e) =>
                set("booking_slots_open", Number(e.target.value) as never)
              }
            />
          </Field>
        </div>
        <Field label="CTA heading">
          <input
            className="input"
            value={form.cta_heading}
            onChange={(e) => set("cta_heading", e.target.value)}
          />
        </Field>
        <Field label="CTA subheading">
          <textarea
            className="textarea"
            rows={2}
            value={form.cta_subheading}
            onChange={(e) => set("cta_subheading", e.target.value)}
          />
        </Field>
        <Field label="CTA benefits (one per line)">
          <textarea
            className="textarea"
            rows={3}
            value={form.cta_benefits}
            onChange={(e) => set("cta_benefits", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Newsletter">
        <Field label="Heading">
          <input
            className="input"
            value={form.newsletter_heading}
            onChange={(e) => set("newsletter_heading", e.target.value)}
          />
        </Field>
        <Field label="Subheading">
          <textarea
            className="textarea"
            rows={2}
            value={form.newsletter_subheading}
            onChange={(e) => set("newsletter_subheading", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="About page copy">
        <Field label="Hero headline">
          <input
            className="input"
            value={form.about_hero_headline}
            onChange={(e) => set("about_hero_headline", e.target.value)}
          />
        </Field>
        <Field label="Hero subheadline">
          <textarea
            className="textarea"
            rows={2}
            value={form.about_hero_subheadline}
            onChange={(e) => set("about_hero_subheadline", e.target.value)}
          />
        </Field>
        <Field label="Origin story">
          <textarea
            className="textarea"
            rows={6}
            value={form.about_origin_story}
            onChange={(e) => set("about_origin_story", e.target.value)}
          />
        </Field>
        <Field label="Philosophy statement">
          <textarea
            className="textarea"
            rows={3}
            value={form.about_philosophy}
            onChange={(e) => set("about_philosophy", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Contact page copy">
        <Field label="Contact intro">
          <textarea
            className="textarea"
            rows={3}
            value={form.contact_intro}
            onChange={(e) => set("contact_intro", e.target.value)}
          />
        </Field>
      </Section>

      {err ? <p className="t-small text-danger">{err}</p> : null}
      {saved ? <p className="t-small text-brand-500">Saved.</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary disabled:opacity-60"
      >
        <Save className="w-4 h-4" />
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
