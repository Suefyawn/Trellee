import { NextResponse } from "next/server";
import { runMonitorChecks } from "@/lib/monitor";

// Triggered by Vercel Cron (see vercel.json). Vercel automatically sends
// `Authorization: Bearer $CRON_SECRET` when the CRON_SECRET env var is set —
// we verify it so the endpoint can't be hammered by the public. If CRON_SECRET
// is unset the endpoint runs unauthenticated (fine before launch, but set it).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else {
    console.warn("[monitor] CRON_SECRET not set — /api/monitor/check is unauthenticated.");
  }

  try {
    const result = await runMonitorChecks();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[monitor] check failed", err);
    return NextResponse.json({ ok: false, error: "check failed" }, { status: 500 });
  }
}
