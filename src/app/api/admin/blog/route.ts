import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

/**
 * Headless Blog API — lets a trusted automation (e.g. a Claude scheduled task)
 * create/update and publish blog posts over HTTP, with no access to Supabase,
 * the codebase, or the admin UI. The only credential is a bearer token.
 *
 *   Authorization: Bearer <BLOG_API_KEY>
 *
 * Inert until BLOG_API_KEY is set (returns 503), like the rest of the app's
 * optional integrations. Runs on the Node runtime (needs crypto + service role)
 * and is excluded from search by robots.ts (/api is disallowed).
 *
 *   GET  /api/admin/blog            → list recent posts + available categories
 *   POST /api/admin/blog            → upsert a post by slug (create/update/publish)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthResult = { ok: true } | { ok: false; status: number; error: string };

function checkAuth(req: Request): AuthResult {
  const key = process.env.BLOG_API_KEY;
  if (!key) {
    return { ok: false, status: 503, error: "Blog API is not configured (set BLOG_API_KEY)." };
  }
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const provided = Buffer.from(match?.[1] ?? "");
  const expected = Buffer.from(key);
  // Constant-time compare; length check first since timingSafeEqual throws on
  // mismatched lengths.
  const valid =
    provided.length === expected.length && timingSafeEqual(provided, expected);
  if (!valid) return { ok: false, status: 401, error: "Unauthorized." };
  return { ok: true };
}

function estimateReadingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function GET(req: Request) {
  const auth = checkAuth(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const sb = createSupabaseAdminClient();
  const [{ data: posts }, { data: categories }] = await Promise.all([
    sb
      .from("blog_posts")
      .select("id, slug, title, status, published_at, category_id")
      .order("created_at", { ascending: false })
      .limit(50),
    sb.from("blog_categories").select("slug, name").order("display_order"),
  ]);

  return NextResponse.json({ ok: true, posts: posts ?? [], categories: categories ?? [] });
}

export async function POST(req: Request) {
  const auth = checkAuth(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const title = str(body.title);
  if (!title) {
    return NextResponse.json({ ok: false, error: "`title` is required." }, { status: 400 });
  }
  const slug = slugify(str(body.slug) || title);
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Could not derive a slug from the title." }, { status: 400 });
  }
  // `body` (markdown) or `content` alias.
  const markdown = str(body.body) || str(body.content);
  const status = body.status === "draft" ? "draft" : "published";

  const sb = createSupabaseAdminClient();

  // Resolve category by slug or name; auto-create it if it doesn't exist yet so
  // the caller never has to manage categories out of band.
  let category_id: string | null = null;
  const categoryName = str(body.category);
  if (categoryName) {
    const catSlug = slugify(categoryName);
    const { data: existing } = await sb
      .from("blog_categories")
      .select("id")
      .eq("slug", catSlug)
      .maybeSingle<{ id: string }>();
    if (existing) {
      category_id = existing.id;
    } else {
      const { data: created } = await sb
        .from("blog_categories")
        .insert({ slug: catSlug, name: categoryName, display_order: 0 })
        .select("id")
        .maybeSingle<{ id: string }>();
      category_id = created?.id ?? null;
    }
  }

  // Best-effort author match by name (never auto-creates a team member).
  let author_id: string | null = null;
  const authorName = str(body.author);
  if (authorName) {
    const { data: author } = await sb
      .from("team_members")
      .select("id")
      .ilike("name", authorName)
      .limit(1)
      .maybeSingle<{ id: string }>();
    author_id = author?.id ?? null;
  }

  const publishedAt =
    status === "published"
      ? str(body.published_at) || new Date().toISOString()
      : str(body.published_at) || null;

  const payload = {
    slug,
    title,
    excerpt: str(body.excerpt) || null,
    body: markdown || null,
    cover_url: str(body.cover_url) || null,
    category_id,
    author_id,
    reading_time:
      typeof body.reading_time === "number"
        ? body.reading_time
        : markdown
          ? estimateReadingTime(markdown)
          : null,
    featured: body.featured === true,
    status: status as "draft" | "published",
    published_at: publishedAt,
    meta_title: str(body.meta_title) || null,
    meta_description: str(body.meta_description) || null,
  };

  // Upsert by slug → idempotent: re-posting the same slug updates in place.
  const { data, error } = await sb
    .from("blog_posts")
    .upsert(payload, { onConflict: "slug" })
    .select("id, slug, status")
    .maybeSingle<{ id: string; slug: string; status: string }>();

  if (error) {
    console.error("[blog-api] upsert error", error);
    return NextResponse.json({ ok: false, error: "Could not save the post." }, { status: 500 });
  }

  // Push the new content live (ISR pages are cached for 10 min otherwise).
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/");

  return NextResponse.json({
    ok: true,
    id: data?.id ?? null,
    slug,
    status: payload.status,
    url: `${SITE_URL}/blog/${slug}`,
  });
}
