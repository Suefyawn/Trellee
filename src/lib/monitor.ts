import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendMonitorAlert } from "@/lib/email";
import type { MonitoredSiteRow } from "@/lib/types/database";

/**
 * Checks every active monitored site once. A site is "up" if it responds with
 * an HTTP status below 400 within the timeout. Alerts are sent only when a
 * site's status *flips* (up→down or down→up), never on the first-ever check.
 */
export async function runMonitorChecks(): Promise<{ checked: number; changed: number }> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("monitored_sites").select("*").eq("active", true);
  const sites = (data ?? []) as MonitoredSiteRow[];

  let changed = 0;

  await Promise.all(
    sites.map(async (site) => {
      let isUp = false;
      let statusCode: number | null = null;
      let error: string | null = null;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const res = await fetch(site.url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: { "user-agent": "TrelleeMonitor/1.0 (+https://trellee.com)" },
          cache: "no-store",
        });
        statusCode = res.status;
        isUp = res.status < 400;
        if (!isUp) error = `HTTP ${res.status}`;
      } catch (e) {
        isUp = false;
        error = e instanceof Error ? e.message : "Request failed";
      } finally {
        clearTimeout(timer);
      }

      const now = new Date().toISOString();
      const flipped = site.is_up !== null && site.is_up !== isUp;

      await sb
        .from("monitored_sites")
        .update({
          is_up: isUp,
          last_status_code: statusCode,
          last_error: error,
          last_checked_at: now,
          ...(site.is_up === null || flipped ? { last_changed_at: now } : {}),
        })
        .eq("id", site.id);

      if (flipped) {
        changed += 1;
        await sendMonitorAlert({ label: site.label, url: site.url, isUp, statusCode, error });
      }
    }),
  );

  return { checked: sites.length, changed };
}
