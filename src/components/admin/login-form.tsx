"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { loginAction } from "@/app/admin/_actions/auth";
import { safeNextPath } from "@/lib/utils";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await loginAction(fd);
      if (res.ok) {
        router.push(safeNextPath(next));
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="t-mono text-muted text-xs">Email</span>
        <input
          name="email"
          type="email"
          className="input mt-2"
          required
          autoComplete="email"
          autoFocus
        />
      </label>
      <label className="block">
        <span className="t-mono text-muted text-xs">Password</span>
        <input
          name="password"
          type="password"
          className="input mt-2"
          required
          autoComplete="current-password"
        />
      </label>
      {error ? <p className="t-small text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full justify-center disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"} <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
