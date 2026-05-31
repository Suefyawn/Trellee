import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads/writes auth cookies through the Next.js cookies() API.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component — safe to ignore.
          }
        },
      },
    },
  );
}

/**
 * Service-role client for admin server actions. Bypasses RLS.
 * NEVER expose this client to the browser.
 */
export function createSupabaseAdminClient() {
  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
