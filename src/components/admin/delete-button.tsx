"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  onDelete,
  label = "Delete",
  confirmText = "Delete?",
  redirectTo,
}: {
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
  label?: string;
  confirmText?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [armed, setArmed] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function trigger() {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 3000);
      return;
    }
    startTransition(async () => {
      const res = await onDelete();
      if (res.ok) {
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } else setErr(res.error ?? "Could not delete.");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={trigger}
        disabled={pending}
        className={`btn ${armed ? "btn-primary" : "btn-secondary"} disabled:opacity-50`}
      >
        <Trash2 className="w-4 h-4" />
        {pending ? "Deleting…" : armed ? confirmText : label}
      </button>
      {err ? <p className="t-small text-danger mt-2">{err}</p> : null}
    </>
  );
}
