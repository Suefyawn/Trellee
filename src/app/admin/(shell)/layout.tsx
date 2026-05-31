import { AdminShell } from "@/components/admin/admin-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

export default async function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware enforces auth; this just surfaces the email in the UI.
  let userEmail: string | null = null;
  if (isSupabaseConfigured()) {
    const sb = await createSupabaseServerClient();
    const { data: { user } } = await sb.auth.getUser();
    userEmail = user?.email ?? null;
  }
  return <AdminShell userEmail={userEmail}>{children}</AdminShell>;
}
