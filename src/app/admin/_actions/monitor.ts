"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { runMonitorChecks } from "@/lib/monitor";
import { requireOwner } from "./guard";

/** Normalize a user-typed URL to an absolute http(s) URL. */
function normalizeUrl(raw: string): string | null {
  let u = raw.trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    return new URL(u).toString();
  } catch {
    return null;
  }
}

export async function addMonitoredSite(label: string, url: string) {
  await requireOwner();
  const normalized = normalizeUrl(url);
  if (!normalized) return { ok: false as const, error: "Enter a valid URL." };
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("monitored_sites").insert({
    label: label.trim() || normalized,
    url: normalized,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/monitor");
  return { ok: true as const };
}

export async function deleteMonitoredSite(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("monitored_sites").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/monitor");
  return { ok: true as const };
}

export async function toggleMonitoredSite(id: string, active: boolean) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("monitored_sites").update({ active }).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/monitor");
  return { ok: true as const };
}

/** Manual "check now" from the admin (runs the same logic as the cron). */
export async function runMonitorChecksNow() {
  await requireOwner();
  const result = await runMonitorChecks();
  revalidatePath("/admin/monitor");
  return { ok: true as const, ...result };
}
