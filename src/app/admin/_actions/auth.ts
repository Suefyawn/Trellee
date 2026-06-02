"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginAction(formData: FormData): Promise<LoginResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Supabase isn't configured yet — set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env.local, then restart the dev server.",
    };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { ok: false, error: "Email and password required." };

  const ownerEmail = process.env.ADMIN_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && email !== ownerEmail) {
    await recordAudit({
      action: "LOGIN_FAILED",
      entity: "auth",
      label: `${email} (not the owner account)`,
      actor: "anon",
    });
    return { ok: false, error: "That account isn't the owner." };
  }

  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    await recordAudit({
      action: "LOGIN_FAILED",
      entity: "auth",
      label: `${email} (${error.message})`,
      actor: "anon",
    });
    return { ok: false, error: error.message };
  }
  await recordAudit({ action: "LOGIN", entity: "auth", label: email });
  return { ok: true };
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const sb = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    await sb.auth.signOut();
    await recordAudit({ action: "LOGOUT", entity: "auth", label: user?.email ?? null });
  }
  redirect("/admin/login");
}
