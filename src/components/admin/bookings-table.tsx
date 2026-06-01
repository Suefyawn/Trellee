"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateBookingAction,
} from "@/app/admin/_actions/wrappers";
import type { BookingRow } from "@/lib/types/database";
import { formatDate, timeAgo } from "@/lib/utils";

const STATUSES: BookingRow["status"][] = [
  "new",
  "contacted",
  "scheduled",
  "won",
  "lost",
  "cancelled",
];

export function BookingsTable({ initial }: { initial: BookingRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<BookingRow["status"] | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = initial.filter((b) => filter === "all" || b.status === filter);

  function updateStatus(b: BookingRow, status: BookingRow["status"]) {
    startTransition(async () => {
      await updateBookingAction(b.id, status);
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
            {s}{" "}
            {s !== "all" ? (
              <span className="opacity-60">
                ({initial.filter((b) => b.status === s).length})
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full min-w-[640px] t-small">
          <thead>
            <tr className="bg-surface-2/60 t-mono text-muted text-xs uppercase tracking-wider">
              <th className="text-left p-4 font-normal">When</th>
              <th className="text-left p-4 font-normal">Contact</th>
              <th className="text-left p-4 font-normal">Service</th>
              <th className="text-left p-4 font-normal">Slot</th>
              <th className="text-left p-4 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <FragmentRow
                key={b.id}
                b={b}
                open={openId === b.id}
                onToggle={() => setOpenId(openId === b.id ? null : b.id)}
                onStatus={(s) => updateStatus(b, s)}
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
  b,
  open,
  onToggle,
  onStatus,
  pending,
}: {
  b: BookingRow;
  open: boolean;
  onToggle: () => void;
  onStatus: (s: BookingRow["status"]) => void;
  pending: boolean;
}) {
  return (
    <>
      <tr
        className="border-t border-border hover:bg-surface-2/40 cursor-pointer"
        onClick={onToggle}
      >
        <td className="p-4">
          <div className="t-small text-fg">{formatDate(b.created_at)}</div>
          <div className="t-mono text-muted text-xs">{timeAgo(b.created_at)}</div>
        </td>
        <td className="p-4">
          <div className="t-small text-fg">{b.name}</div>
          <div className="t-mono text-muted text-xs">{b.email}</div>
          {b.company ? (
            <div className="t-mono text-muted text-xs">{b.company}</div>
          ) : null}
        </td>
        <td className="p-4 t-mono text-muted text-xs">{b.service_slug ?? "—"}</td>
        <td className="p-4 t-mono text-muted text-xs">
          {b.time_slot_at ?? "—"}
          {b.timezone ? <div className="opacity-60">{b.timezone}</div> : null}
        </td>
        <td className="p-4">
          <select
            value={b.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              onStatus(e.target.value as BookingRow["status"])
            }
            disabled={pending}
            className="select py-1 px-2 text-xs"
          >
            {(
              ["new", "contacted", "scheduled", "won", "lost", "cancelled"] as const
            ).map((s) => (
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
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="mono-tag mb-2">Contact</div>
                <div className="t-small">
                  <a
                    href={`mailto:${b.email}`}
                    className="text-fg hover:text-brand-500 transition"
                  >
                    {b.email}
                  </a>
                </div>
                {b.phone ? (
                  <div className="t-mono text-muted text-xs mt-1">{b.phone}</div>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <div className="mono-tag mb-2">Notes</div>
                <p className="t-small text-muted whitespace-pre-wrap">
                  {b.notes ?? "—"}
                </p>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
