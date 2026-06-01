"use client";

import { useMemo, useState, useTransition } from "react";
import { Calendar, Mail, MessageSquare, Save } from "lucide-react";
import {
  updateCrmStageAction,
  updateCrmNotesAction,
  updateCrmDealAction,
} from "@/app/admin/_actions/wrappers";
import type { CrmLead, CrmStage } from "@/lib/types/database";
import { formatDate, timeAgo } from "@/lib/utils";

function money(n: number) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${n}`;
  }
}

const STAGES: { key: CrmStage; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export function CrmBoard({ leads }: { leads: CrmLead[] }) {
  const [items, setItems] = useState<CrmLead[]>(leads);

  const byStage = useMemo(() => {
    const map: Record<CrmStage, CrmLead[]> = {
      new: [],
      contacted: [],
      qualified: [],
      proposal: [],
      won: [],
      lost: [],
    };
    for (const l of items) map[l.pipeline_stage]?.push(l);
    return map;
  }, [items]);

  function moveStage(lead: CrmLead, stage: CrmStage) {
    setItems((arr) =>
      arr.map((l) =>
        l.source === lead.source && l.id === lead.id
          ? { ...l, pipeline_stage: stage }
          : l,
      ),
    );
    void updateCrmStageAction(lead.source, lead.id, stage);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => (
        <div key={stage.key} className="w-[300px] flex-shrink-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="mono-tag">{stage.label}</span>
            <span className="t-mono text-muted text-xs">
              {byStage[stage.key].length}
            </span>
          </div>
          <div className="space-y-3 min-h-[80px]">
            {byStage[stage.key].map((lead) => (
              <LeadCard
                key={`${lead.source}-${lead.id}`}
                lead={lead}
                onMove={(s) => moveStage(lead, s)}
              />
            ))}
            {byStage[stage.key].length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 t-mono text-muted text-[11px] text-center">
                empty
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadCard({
  lead,
  onMove,
}: {
  lead: CrmLead;
  onMove: (stage: CrmStage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(lead.crm_notes ?? "");
  const [value, setValue] = useState(
    lead.deal_value != null ? String(lead.deal_value) : "",
  );
  const [reason, setReason] = useState(lead.outcome_reason ?? "");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const isClosed = lead.pipeline_stage === "won" || lead.pipeline_stage === "lost";

  function saveAll() {
    startTransition(async () => {
      await Promise.all([
        updateCrmNotesAction(lead.source, lead.id, notes),
        updateCrmDealAction(lead.source, lead.id, {
          deal_value: value.trim() === "" ? null : Number(value),
          outcome_reason: reason,
        }),
      ]);
      setSavedAt(new Date().toLocaleTimeString());
    });
  }

  return (
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="t-small text-fg truncate">{lead.name}</div>
          {lead.company ? (
            <div className="t-mono text-muted text-[11px] truncate">
              {lead.company}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="badge text-[9px]">
            {lead.source === "booking" ? (
              <Calendar className="w-3 h-3" />
            ) : (
              <MessageSquare className="w-3 h-3" />
            )}
            {lead.source}
          </span>
          {lead.deal_value != null ? (
            <span className="badge badge-brand text-[9px]">
              {money(lead.deal_value)}
            </span>
          ) : null}
        </div>
      </div>

      <a
        href={`mailto:${lead.email}`}
        className="t-mono text-muted text-[11px] mt-2 flex items-center gap-1.5 hover:text-brand-500 transition truncate"
      >
        <Mail className="w-3 h-3 flex-shrink-0" /> {lead.email}
      </a>

      {lead.detail ? (
        <p className="t-small text-muted mt-2 line-clamp-3">{lead.detail}</p>
      ) : null}
      {lead.meta ? (
        <p className="t-mono text-muted text-[10px] mt-2">{lead.meta}</p>
      ) : null}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <select
          className="select py-1 text-xs"
          value={lead.pipeline_stage}
          onChange={(e) => onMove(e.target.value as CrmStage)}
          aria-label="Move to stage"
        >
          {STAGES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="t-mono text-muted text-[10px] hover:text-fg transition"
        >
          {lead.crm_notes && !open ? "● note" : open ? "hide" : "note"}
        </button>
      </div>

      {open ? (
        <div className="mt-3 space-y-2">
          <label className="block">
            <span className="t-mono text-muted text-[10px]">Est. value ($)</span>
            <input
              type="number"
              min={0}
              className="input text-xs mt-1"
              placeholder="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          {isClosed ? (
            <label className="block">
              <span className="t-mono text-muted text-[10px]">
                {lead.pipeline_stage === "won" ? "Why won" : "Why lost"}
              </span>
              <input
                className="input text-xs mt-1"
                placeholder="Reason…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          ) : null}
          <textarea
            className="textarea text-xs"
            rows={3}
            placeholder="Private CRM note…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <span className="t-mono text-muted text-[10px]">
              {lead.crm_updated_at
                ? `updated ${timeAgo(lead.crm_updated_at)}`
                : formatDate(lead.created_at)}
              {savedAt ? ` · saved ${savedAt}` : ""}
            </span>
            <button
              type="button"
              onClick={saveAll}
              disabled={pending}
              className="btn btn-secondary text-xs py-1 disabled:opacity-60"
            >
              <Save className="w-3 h-3" /> {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
