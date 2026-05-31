"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadAction } from "@/app/admin/_actions/wrappers";
import type { ContactSubmissionRow } from "@/lib/types/database";
import { formatDate, timeAgo } from "@/lib/utils";

const STATUSES: ContactSubmissionRow["status"][] = [
  "new",
  "contacted",
  "closed",
  "spam",
];

export function LeadsTable({ initial }: { initial: ContactSubmissionRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<ContactSubmissionRow["status"] | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = initial.filter((b) => filter === "all" || b.status === filter);

  function updateStatus(l: ContactSubmissionRow, status: ContactSubmissionRow["status"]) {
    startTransition(async () => {
      await updateLeadAction(l.id, status);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md t-mono text-xs transition ${
              filter === s
                ? "bg-fg text-bg"
                : "text-muted hover:text-fg hover:bg-surface-2"
            }`}
          >
            {s}
            {s !== "all" ? (
              <span className="opacity-60">
                {" "}
                ({initial.filter((b) => b.status === s).length})
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="surface-card overflow-hidden">
        <table className="w-full t-small">
          <thead>
            <tr className="bg-surface-2/60 t-mono text-muted text-xs uppercase tracking-wider">
              <th className="text-left p-4 font-normal">When</th>
              <th className="text-left p-4 font-normal">Contact</th>
              <th className="text-left p-4 font-normal">Services</th>
              <th className="text-left p-4 font-normal">Budget</th>
              <th className="text-left p-4 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <FragmentRow
                key={l.id}
                l={l}
                open={openId === l.id}
                onToggle={() => setOpenId(openId === l.id ? null : l.id)}
                onStatus={(s) => updateStatus(l, s)}
                pending={pending}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FragmentRow({
  l,
  open,
  onToggle,
  onStatus,
  pending,
}: {
  l: ContactSubmissionRow;
  open: boolean;
  onToggle: () => void;
  onStatus: (s: ContactSubmissionRow["status"]) => void;
  pending: boolean;
}) {
  return (
    <>
      <tr
        className="border-t border-border hover:bg-surface-2/40 cursor-pointer"
        onClick={onToggle}
      >
        <td className="p-4">
          <div className="t-small text-fg">{formatDate(l.created_at)}</div>
          <div className="t-mono text-muted text-xs">{timeAgo(l.created_at)}</div>
        </td>
        <td className="p-4">
          <div className="t-small text-fg">{l.name}</div>
          <div className="t-mono text-muted text-xs">{l.email}</div>
          {l.company ? (
            <div className="t-mono text-muted text-xs">{l.company}</div>
          ) : null}
        </td>
        <td className="p-4 t-mono text-muted text-xs">
          {l.services.length > 0 ? l.services.join(", ") : "—"}
        </td>
        <td className="p-4 t-mono text-muted text-xs">{l.budget ?? "—"}</td>
        <td className="p-4">
          <select
            value={l.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              onStatus(e.target.value as ContactSubmissionRow["status"])
            }
            disabled={pending}
            className="select py-1 px-2 text-xs"
          >
            {(["new", "contacted", "closed", "spam"] as const).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </td>
      </tr>
      {open ? (
        <tr className="border-t border-border bg-surface-2/30">
          <td colSpan={5} className="p-6">
            <div className="mono-tag mb-2">Brief</div>
            <p className="t-small whitespace-pre-wrap">{l.message}</p>
          </td>
        </tr>
      ) : null}
    </>
  );
}
