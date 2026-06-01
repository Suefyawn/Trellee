"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, Check, Clock } from "lucide-react";
import type { ServiceRow } from "@/lib/types/database";
import { submitBooking } from "@/app/actions/booking";
import { cn } from "@/lib/utils";
import { ServiceIcon } from "./service-icon";

type Step = "service" | "time" | "details" | "confirm";

const STEPS: { key: Step; label: string }[] = [
  { key: "service", label: "Service" },
  { key: "time", label: "Time" },
  { key: "details", label: "Details" },
  { key: "confirm", label: "Confirm" },
];

const TIME_SLOTS = ["9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "3:00 PM", "4:30 PM"];

function nextWeekdays(count = 7) {
  const out: Date[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (out.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function BookingFlow({
  services,
  initialServiceSlug,
  ctaCopy,
}: {
  services: ServiceRow[];
  initialServiceSlug?: string;
  ctaCopy: { heading: string; subheading: string };
}) {
  const [step, setStep] = useState<Step>(initialServiceSlug ? "time" : "service");
  const [serviceSlug, setServiceSlug] = useState<string | undefined>(
    initialServiceSlug,
  );
  const [pickedDate, setPickedDate] = useState<string | undefined>();
  const [pickedTime, setPickedTime] = useState<string | undefined>();
  const [details, setDetails] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    notes: "",
  });
  const [done, setDone] = useState<{ id: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const dates = useMemo(() => nextWeekdays(8), []);
  const service = services.find((s) => s.slug === serviceSlug);
  const tz = typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC";

  function canAdvance() {
    if (step === "service") return !!serviceSlug;
    if (step === "time") return !!pickedDate && !!pickedTime;
    if (step === "details")
      return details.name.trim().length > 0 && /^\S+@\S+\.\S+$/.test(details.email);
    return false;
  }

  function next() {
    setError(null);
    if (!canAdvance()) return;
    const i = STEPS.findIndex((s) => s.key === step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1].key);
  }

  function back() {
    const i = STEPS.findIndex((s) => s.key === step);
    if (i > 0) setStep(STEPS[i - 1].key);
  }

  function handleSubmit() {
    setError(null);
    const time_slot_at =
      pickedDate && pickedTime ? `${pickedDate} ${pickedTime}` : undefined;
    startTransition(async () => {
      const res = await submitBooking({
        service_slug: serviceSlug,
        time_slot_at,
        timezone: tz,
        name: details.name,
        email: details.email,
        company: details.company || undefined,
        phone: details.phone || undefined,
        notes: details.notes || undefined,
      });
      if (res.ok) {
        setDone({ id: res.id });
        setStep("confirm");
      } else {
        setError(res.error);
      }
    });
  }

  if (done && step === "confirm") {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 rounded-full bg-brand-500/10 border border-brand-500/40 flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-brand-500" />
        </div>
        <h1 className="t-display-l mt-6 font-display">You&apos;re on the calendar.</h1>
        <p className="t-body-l text-muted mt-4 max-w-lg mx-auto">
          We&apos;ll send a confirmation to <span className="text-fg">{details.email}</span>{" "}
          within the next 10 minutes. If you don&apos;t see it, check spam, and reach out
          on Slack or WhatsApp if all else fails.
        </p>

        <div className="surface-card p-6 mt-10 max-w-md mx-auto text-left">
          <div className="flex items-center justify-between t-mono text-muted text-xs">
            <span>BOOKING SUMMARY</span>
            <span className="text-brand-500">CONFIRMED</span>
          </div>
          <dl className="mt-5 space-y-3 t-small">
            {service ? (
              <div className="flex items-start gap-3">
                <dt className="t-mono text-muted w-20 flex-shrink-0">Service</dt>
                <dd>{service.title}</dd>
              </div>
            ) : null}
            <div className="flex items-start gap-3">
              <dt className="t-mono text-muted w-20 flex-shrink-0">When</dt>
              <dd>
                {pickedDate} · {pickedTime}
                <span className="t-mono text-muted ml-2">({tz})</span>
              </dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="t-mono text-muted w-20 flex-shrink-0">Who</dt>
              <dd>{details.name}</dd>
            </div>
          </dl>
        </div>

        <Link href="/" className="btn btn-secondary mt-10 inline-flex">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-12">
        <span className="mono-tag justify-center">Book a call</span>
        <h1 className="t-display-l mt-4 font-display">{ctaCopy.heading}</h1>
        <p className="t-body text-muted mt-4 max-w-xl mx-auto">
          {ctaCopy.subheading}
        </p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center justify-center gap-2 mb-12 t-mono text-xs">
        {STEPS.map((s, i) => {
          const active = i === stepIdx;
          const past = i < stepIdx;
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border transition",
                  active && "bg-fg text-bg border-fg",
                  past && "bg-brand-500/20 text-brand-500 border-brand-500/40",
                  !active && !past && "text-muted border-border",
                )}
              >
                {past ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  "transition hidden sm:inline",
                  active ? "text-fg" : past ? "text-muted" : "text-muted/60",
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 ? (
                <span className="w-6 sm:w-8 h-px bg-border" />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="surface-card p-6 sm:p-8 lg:p-10 max-w-3xl mx-auto">
        {step === "service" ? (
          <>
            <h2 className="t-heading-xl font-display">What can we help with?</h2>
            <p className="t-body text-muted mt-2">
              Pick the closest match. We&apos;ll figure out the rest on the call.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-8">
              {services.map((svc) => {
                const isSel = serviceSlug === svc.slug;
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => setServiceSlug(svc.slug)}
                    className={cn(
                      "text-left p-5 rounded-lg border transition group",
                      isSel
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-border bg-surface hover:border-border-strong",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <ServiceIcon
                        name={svc.icon}
                        className={cn(
                          "w-5 h-5",
                          isSel ? "text-brand-500" : "text-fg/80",
                        )}
                      />
                      {isSel ? (
                        <Check className="w-4 h-4 text-brand-500" />
                      ) : null}
                    </div>
                    <div className="mt-4">
                      <h3 className="t-heading-l font-display">{svc.title}</h3>
                      <p className="t-small text-muted mt-1.5 line-clamp-2">
                        {svc.hero_snippet ?? svc.summary}
                      </p>
                    </div>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setServiceSlug("other")}
                className={cn(
                  "text-left p-5 rounded-lg border transition",
                  serviceSlug === "other"
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-border bg-surface hover:border-border-strong",
                )}
              >
                <h3 className="t-heading-l font-display">Not sure yet</h3>
                <p className="t-small text-muted mt-1.5">
                  Talk it through. We&apos;ll help scope.
                </p>
              </button>
            </div>
          </>
        ) : null}

        {step === "time" ? (
          <>
            <h2 className="t-heading-xl font-display">When works?</h2>
            <p className="t-body text-muted mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> 30 minutes ·{" "}
              <span className="t-mono">{tz}</span>
            </p>

            <div className="mt-8">
              <span className="mono-tag mb-3 inline-flex">Pick a day</span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {dates.map((d) => {
                  const iso = d.toISOString().slice(0, 10);
                  const dayName = d.toLocaleDateString("en-US", {
                    weekday: "short",
                  });
                  const dayNum = d.getDate();
                  const isSel = pickedDate === iso;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setPickedDate(iso)}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg border transition",
                        isSel
                          ? "border-brand-500 bg-brand-500/10"
                          : "border-border bg-surface hover:border-border-strong",
                      )}
                    >
                      <span className="t-mono text-[10px] text-muted uppercase">
                        {dayName}
                      </span>
                      <span
                        className={cn(
                          "font-display text-xl mt-1",
                          isSel ? "text-fg" : "text-muted",
                        )}
                      >
                        {dayNum}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8">
              <span className="mono-tag mb-3 inline-flex">Pick a time</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSel = pickedTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setPickedTime(slot)}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border t-mono text-xs transition",
                        isSel
                          ? "border-brand-500 bg-brand-500/10 text-fg"
                          : "border-border bg-surface text-muted hover:text-fg hover:border-border-strong",
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        {step === "details" ? (
          <>
            <h2 className="t-heading-xl font-display">Who&apos;s joining?</h2>
            <p className="t-body text-muted mt-2">
              Just the basics. We won&apos;t harass you with sequences.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              <label className="block">
                <span className="t-mono text-muted text-xs">Name</span>
                <input
                  className="input mt-2"
                  value={details.name}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, name: e.target.value }))
                  }
                  placeholder="Alex Rivera"
                  required
                />
              </label>
              <label className="block">
                <span className="t-mono text-muted text-xs">Email</span>
                <input
                  type="email"
                  className="input mt-2"
                  value={details.email}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, email: e.target.value }))
                  }
                  placeholder="alex@company.com"
                  required
                />
              </label>
              <label className="block">
                <span className="t-mono text-muted text-xs">Company</span>
                <input
                  className="input mt-2"
                  value={details.company}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, company: e.target.value }))
                  }
                  placeholder="Acme Inc."
                />
              </label>
              <label className="block">
                <span className="t-mono text-muted text-xs">Phone (optional)</span>
                <input
                  className="input mt-2"
                  value={details.phone}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, phone: e.target.value }))
                  }
                  placeholder="+1 305 555 0100"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="t-mono text-muted text-xs">What&apos;s on your mind?</span>
                <textarea
                  className="textarea mt-2"
                  rows={4}
                  value={details.notes}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, notes: e.target.value }))
                  }
                  placeholder="A few sentences about the project, budget shape, deadline if any."
                />
              </label>
            </div>

            {error ? (
              <p className="t-small text-danger mt-4">{error}</p>
            ) : null}

            <div className="surface-card mt-6 p-4 flex items-center gap-3 t-small text-muted bg-surface-2/50">
              <Calendar className="w-4 h-4 text-brand-500" />
              <span>
                <span className="text-fg">{pickedDate}</span> · {pickedTime} (
                {tz}) ·{" "}
                <span className="text-fg">{service?.title ?? "30 min call"}</span>
              </span>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-between mt-6 max-w-3xl mx-auto">
        {stepIdx > 0 ? (
          <button
            type="button"
            onClick={back}
            className="btn btn-ghost"
            disabled={pending}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <div />
        )}

        {step === "details" ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canAdvance() || pending}
            className="btn btn-primary disabled:opacity-50"
          >
            {pending ? "Submitting…" : "Confirm booking"}{" "}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance()}
            className="btn btn-primary disabled:opacity-50"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
