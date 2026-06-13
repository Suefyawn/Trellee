import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/site/logo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

export const metadata = { title: "Admin login" };

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;

  // If already logged in & authorized, bounce to admin
  if (isSupabaseConfigured()) {
    const sb = await createSupabaseServerClient();
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const ownerEmail = process.env.ADMIN_OWNER_EMAIL?.toLowerCase();
      if (!ownerEmail || user.email?.toLowerCase() === ownerEmail) {
        redirect(safeNextPath(params.next));
      }
    }
  }

  const errorMessage =
    params.error === "supabase_not_configured"
      ? "Supabase isn't configured yet — set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env.local, then restart the dev server."
      : params.error === "unauthorized"
        ? "That account isn't the owner. Sign in with the email set as ADMIN_OWNER_EMAIL."
        : null;

  return (
    <main className="min-h-screen grid place-items-center px-6 py-12 bg-bg">
      <div className="w-full max-w-md">
        <Link href="/" aria-label="Trellee — home" className="inline-block">
          <Logo size="md" priority />
        </Link>

        <div className="surface-card p-8 mt-8">
          <span className="mono-tag">Admin · sign in</span>
          <h1 className="t-heading-xl font-display mt-3">Welcome back.</h1>
          <p className="t-small text-muted mt-2">
            Single-owner access. Use the email set as <span className="t-mono">ADMIN_OWNER_EMAIL</span>.
          </p>

          {errorMessage ? (
            <div className="mt-5 rounded-lg border border-danger/40 bg-danger/10 p-3 t-small text-danger/90">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-6">
            <LoginForm next={params.next} />
          </div>

          <div className="mt-8 pt-6 border-t border-border t-mono text-muted text-xs">
            Forgot the password? Reset it from the Supabase dashboard → Auth → Users.
          </div>
        </div>

        <p className="t-mono text-muted text-xs text-center mt-6">
          <Link href="/" className="hover:text-fg transition">
            ← back to site
          </Link>
        </p>
      </div>
    </main>
  );
}
