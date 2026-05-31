import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Auth gate for /admin routes.
 * Runs in `middleware.ts` at the edge. Refreshes the Supabase session on every request,
 * then redirects to /admin/login if not authenticated or not the owner.
 */
function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // If Supabase isn't wired up yet, only block /admin (except /login) so the
  // public marketing site keeps working locally before env is set.
  if (!isSupabaseConfigured()) {
    const { pathname } = request.nextUrl;
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "supabase_not_configured");
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";

  if (isAdmin && !isAdminLogin) {
    const ownerEmail = process.env.ADMIN_OWNER_EMAIL?.toLowerCase();
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  return response;
}
