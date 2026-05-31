import { updateSupabaseSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    /*
     * Match every path except:
     *   - _next/static (build assets)
     *   - _next/image (image optimization)
     *   - favicon, public files (svg/png/jpg/etc.)
     * The auth check inside the handler then narrows to /admin/*.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
