"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions/newsletter";
import { track } from "@/lib/analytics";

export function NewsletterForm({ source = "blog" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await subscribeNewsletter(email, source);
      if (res.ok) {
        track("newsletter_subscribed", { source });
        setDone(true);
      } else setError(res.error);
    });
  }

  if (done) {
    return (
      <p className="mt-8 inline-flex items-center gap-2 t-body text-brand-500">
        <Check className="w-4 h-4" /> You&apos;re on the list. Talk soon.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="you@company.com"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary justify-center disabled:opacity-60"
        >
          {pending ? "Subscribing…" : "Subscribe"}
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
      {error ? <p className="t-small text-danger mt-2">{error}</p> : null}
    </form>
  );
}
