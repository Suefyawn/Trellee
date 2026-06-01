"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  addMonitoredSiteAction,
  deleteMonitoredSiteAction,
  toggleMonitoredSiteAction,
  runMonitorChecksNowAction,
} from "@/app/admin/_actions/wrappers";
import type { MonitoredSiteRow } from "@/lib/types/database";
import { timeAgo } from "@/lib/utils";

export function MonitorPanel({ sites }: { sites: MonitoredSiteRow[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [adding, startAdd] = useTransition();
  const [checking, startCheck] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startAdd(async () => {
      const res = await addMonitoredSiteAction(label, url);
      if (!res.ok) return setErr(res.error ?? "Could not add site.");
      setLabel("");
      setUrl("");
      router.refresh();
    });
  }

  function checkNow() {
    setMsg(null);
    startCheck(async () => {
      const res = await runMonitorChecksNowAction();
      if (res.ok) {
        setMsg(`Checked ${res.checked} site${res.checked === 1 ? "" : "s"}${
          res.changed ? ` · ${res.changed} changed` : ""
        }.`);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="surface-card p-6">
        <form onSubmit={add} className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[160px]">
            <span className="t-mono text-muted text-xs">Label</span>
            <input
              className="input mt-2"
              placeholder="Client name / site"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <label className="flex-[2] min-w-[220px]">
            <span className="t-mono text-muted text-xs">URL</span>
            <input
              className="input mt-2"
              placeholder="example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={adding} className="btn btn-primary disabled:opacity-60">
            <Plus className="w-4 h-4" /> {adding ? "Adding…" : "Add site"}
          </button>
          <button
            type="button"
            onClick={checkNow}
            disabled={checking}
            className="btn btn-secondary disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking…" : "Check now"}
          </button>
        </form>
        {err ? <p className="t-small text-danger mt-3">{err}</p> : null}
        {msg ? <p className="t-small text-brand-500 mt-3">{msg}</p> : null}
      </div>

      {sites.length === 0 ? (
        <p className="t-body text-muted">No sites monitored yet. Add one above.</p>
      ) : (
        <div className="surface-card overflow-hidden">
          <table className="w-full t-small">
            <thead>
              <tr className="bg-surface-2/60 t-mono text-muted text-xs uppercase tracking-wider">
                <th className="text-left p-4 font-normal">Status</th>
                <th className="text-left p-4 font-normal">Site</th>
                <th className="text-left p-4 font-normal">Code</th>
                <th className="text-left p-4 font-normal">Last checked</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => {
                const state =
                  s.is_up === null ? "unknown" : s.is_up ? "up" : "down";
                const color =
                  state === "up"
                    ? "bg-brand-500"
                    : state === "down"
                      ? "bg-danger"
                      : "bg-border-strong";
                return (
                  <tr key={s.id} className="border-t border-border">
                    <td className="p-4">
                      <span className="inline-flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                        <span className={s.active ? "" : "text-muted"}>
                          {state === "unknown" ? "—" : state}
                          {!s.active ? " (paused)" : ""}
                        </span>
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-fg">{s.label}</div>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="t-mono text-muted text-xs hover:text-brand-500 transition break-all"
                      >
                        {s.url}
                      </a>
                      {s.last_error && state === "down" ? (
                        <div className="t-mono text-danger text-[11px] mt-1">{s.last_error}</div>
                      ) : null}
                    </td>
                    <td className="p-4 t-mono text-muted">
                      {s.last_status_code ?? "—"}
                    </td>
                    <td className="p-4 t-mono text-muted text-xs">
                      {s.last_checked_at ? timeAgo(s.last_checked_at) : "never"}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          toggleMonitoredSiteAction(s.id, !s.active).then(() => router.refresh())
                        }
                        className="t-mono text-muted text-xs hover:text-fg transition mr-4"
                      >
                        {s.active ? "pause" : "resume"}
                      </button>
                      <button
                        type="button"
                        aria-label="Remove site"
                        onClick={() =>
                          deleteMonitoredSiteAction(s.id).then(() => router.refresh())
                        }
                        className="text-muted hover:text-danger transition"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
