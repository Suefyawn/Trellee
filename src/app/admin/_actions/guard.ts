"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

/**
 * Server-side authorization check. Call at the top of every mutating server action.
 * Middleware already gates the /admin routes — this is defense-in-depth in case
 * an action is invoked from an unexpected path.
 */
export async function requireOwner() {
  if (!isSupabaseConfigured()) {
    redirect("/admin/login?error=supabase_not_configured");
  }
  const sb = await createSupabaseServerClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");
  // Fail closed: a configured project with no owner email set must deny, not
  // grant admin to any authenticated user (in case signup is ever enabled).
  const ownerEmail = process.env.ADMIN_OWNER_EMAIL?.toLowerCase();
  if (!ownerEmail || user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin/login?error=unauthorized");
  }
  return user;
}
