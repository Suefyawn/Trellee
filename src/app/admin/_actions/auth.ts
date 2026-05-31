"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    return { ok: false, error: "That account isn't the owner." };
  }

  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const sb = await createSupabaseServerClient();
    await sb.auth.signOut();
  }
  redirect("/admin/login");
}
