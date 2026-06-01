/**
 * CMS — server-side data access layer.
 *
 * Each function:
 *   1. Returns demo data if Supabase env vars are missing (so the site renders locally before wiring).
 *   2. Otherwise queries Supabase. On query error or empty result, falls back to demo data so a
 *      misconfigured env doesn't break the marketing site. Errors are logged to the server console.
 *
 * The admin (when authenticated) always reads from Supabase directly via the server client;
 * these helpers are for the public marketing site.
 */

import "server-only";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import * as demo from "./demo-data";
import type {
  ActivityFeedRow,
  BlogCategoryRow,
  BlogPostRow,
  ClientRow,
  FAQRow,
  PricingTierRow,
  ProcessStepRow,
  ProjectRow,
  ReviewRow,
  ServiceRow,
  SiteSettingsRow,
  SocialLinkRow,
  TeamMemberRow,
  ValueRow,
} from "@/lib/types/database";

function isSupabaseConfigured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR-PROJECT-REF")
  );
}

async function query<T>(
  fn: (sb: ReturnType<typeof createSupabasePublicClient>) => Promise<{
    data: T | null;
    error: { message: string } | null;
  }>,
  fallback: T,
  label: string,
): Promise<T> {
  // Demo data is ONLY for local dev with no Supabase configured. Once a real
  // project is wired up, the database is the source of truth — an empty table
  // means an empty section (no phantom demo content in production).
  if (!isSupabaseConfigured()) return fallback;
  try {
    const sb = createSupabasePublicClient();
    const { data, error } = await fn(sb);
    if (error) console.warn(`[cms:${label}]`, error.message);
    // Return whatever the DB gave us — `[]` for empty lists, `null` for a
    // missing single row. Never substitute demo data here.
    return data as T;
  } catch (err) {
    // Only a hard throw (e.g. client init failure) falls back, to keep the
    // marketing site from hard-crashing on an unexpected error.
    console.warn(`[cms:${label}] threw`, err);
    return fallback;
  }
}

// ---------------------------------------------------------------- Site settings
export async function getSiteSettings(): Promise<SiteSettingsRow> {
  return query<SiteSettingsRow>(
    async (sb) => {
      const { data, error } = await sb
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      return { data: data as SiteSettingsRow | null, error };
    },
    demo.demoSiteSettings,
    "site_settings",
  );
}

// ---------------------------------------------------------------- Services
export async function getServices(opts?: { featuredOnly?: boolean }): Promise<ServiceRow[]> {
  return query<ServiceRow[]>(
    async (sb) => {
      let q = sb.from("services").select("*").order("display_order", { ascending: true });
      if (opts?.featuredOnly) q = q.eq("featured", true);
      const { data, error } = await q;
      return { data: (data ?? []) as ServiceRow[], error };
    },
    opts?.featuredOnly ? demo.demoServices.filter((s) => s.featured) : demo.demoServices,
    "services",
  );
}

export async function getServiceBySlug(slug: string): Promise<ServiceRow | null> {
  const fallback = demo.demoServices.find((s) => s.slug === slug) ?? null;
  return query<ServiceRow | null>(
    async (sb) => {
      const { data, error } = await sb
        .from("services")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      return { data: data as ServiceRow | null, error };
    },
    fallback,
    "service_by_slug",
  );
}

// ---------------------------------------------------------------- Pricing tiers
export async function getPricingTiersForService(serviceId: string): Promise<PricingTierRow[]> {
  const fallback = demo.demoPricingTiers.filter((t) => t.service_id === serviceId);
  return query<PricingTierRow[]>(
    async (sb) => {
      const { data, error } = await sb
        .from("pricing_tiers")
        .select("*")
        .eq("service_id", serviceId)
        .order("display_order", { ascending: true });
      return { data: (data ?? []) as PricingTierRow[], error };
    },
    fallback,
    "pricing_tiers",
  );
}

// ---------------------------------------------------------------- FAQs
export async function getFAQs(opts?: { category?: string; serviceId?: string }): Promise<FAQRow[]> {
  let fallback = demo.demoFAQs;
  if (opts?.category) fallback = fallback.filter((f) => f.category === opts.category);
  if (opts?.serviceId) fallback = fallback.filter((f) => f.service_id === opts.serviceId);

  return query<FAQRow[]>(
    async (sb) => {
      let q = sb.from("faqs").select("*").order("display_order", { ascending: true });
      if (opts?.category) q = q.eq("category", opts.category);
      if (opts?.serviceId) q = q.eq("service_id", opts.serviceId);
      const { data, error } = await q;
      return { data: (data ?? []) as FAQRow[], error };
    },
    fallback,
    "faqs",
  );
}

// ---------------------------------------------------------------- Clients
export async function getClients(opts?: { featuredOnly?: boolean }): Promise<ClientRow[]> {
  return query<ClientRow[]>(
    async (sb) => {
      let q = sb.from("clients").select("*").order("display_order", { ascending: true });
      if (opts?.featuredOnly) q = q.eq("featured", true);
      const { data, error } = await q;
      return { data: (data ?? []) as ClientRow[], error };
    },
    opts?.featuredOnly ? demo.demoClients.filter((c) => c.featured) : demo.demoClients,
    "clients",
  );
}

// ---------------------------------------------------------------- Projects
export async function getProjects(opts?: {
  featuredOnly?: boolean;
  limit?: number;
  service?: string;
}): Promise<ProjectRow[]> {
  let fallback = demo.demoProjects;
  if (opts?.featuredOnly) fallback = fallback.filter((p) => p.featured);
  if (opts?.service) fallback = fallback.filter((p) => p.service_categories.includes(opts.service!));
  if (opts?.limit) fallback = fallback.slice(0, opts.limit);

  return query<ProjectRow[]>(
    async (sb) => {
      let q = sb
        .from("projects")
        .select("*")
        .eq("status", "published")
        .order("featured_order", { ascending: true });
      if (opts?.featuredOnly) q = q.eq("featured", true);
      if (opts?.service) q = q.contains("service_categories", [opts.service]);
      if (opts?.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      return { data: (data ?? []) as ProjectRow[], error };
    },
    fallback,
    "projects",
  );
}

export async function getProjectBySlug(slug: string): Promise<ProjectRow | null> {
  const fallback = demo.demoProjects.find((p) => p.slug === slug) ?? null;
  return query<ProjectRow | null>(
    async (sb) => {
      const { data, error } = await sb
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      return { data: data as ProjectRow | null, error };
    },
    fallback,
    "project_by_slug",
  );
}

// ---------------------------------------------------------------- Reviews
export async function getReviews(opts?: {
  featuredOnly?: boolean;
  projectId?: string;
  limit?: number;
}): Promise<ReviewRow[]> {
  let fallback = demo.demoReviews;
  if (opts?.featuredOnly) fallback = fallback.filter((r) => r.featured);
  if (opts?.projectId) fallback = fallback.filter((r) => r.project_id === opts.projectId);
  if (opts?.limit) fallback = fallback.slice(0, opts.limit);

  return query<ReviewRow[]>(
    async (sb) => {
      let q = sb.from("reviews").select("*").order("display_order", { ascending: true });
      if (opts?.featuredOnly) q = q.eq("featured", true);
      if (opts?.projectId) q = q.eq("project_id", opts.projectId);
      if (opts?.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      return { data: (data ?? []) as ReviewRow[], error };
    },
    fallback,
    "reviews",
  );
}

// ---------------------------------------------------------------- Process steps
export async function getProcessSteps(opts?: { serviceId?: string }): Promise<ProcessStepRow[]> {
  let fallback = demo.demoProcessSteps;
  if (opts?.serviceId)
    fallback = fallback.filter((s) => s.service_id === opts.serviceId || s.service_id === null);

  return query<ProcessStepRow[]>(
    async (sb) => {
      let q = sb.from("process_steps").select("*").order("display_order", { ascending: true });
      if (opts?.serviceId) {
        q = q.or(`service_id.eq.${opts.serviceId},service_id.is.null`);
      } else {
        q = q.is("service_id", null);
      }
      const { data, error } = await q;
      return { data: (data ?? []) as ProcessStepRow[], error };
    },
    opts?.serviceId ? fallback : demo.demoProcessSteps.filter((s) => s.service_id === null),
    "process_steps",
  );
}

// ---------------------------------------------------------------- Values + Team
export async function getValues(): Promise<ValueRow[]> {
  return query<ValueRow[]>(
    async (sb) => {
      const { data, error } = await sb
        .from("values")
        .select("*")
        .order("display_order", { ascending: true });
      return { data: (data ?? []) as ValueRow[], error };
    },
    demo.demoValues,
    "values",
  );
}

export async function getTeamMembers(): Promise<TeamMemberRow[]> {
  return query<TeamMemberRow[]>(
    async (sb) => {
      const { data, error } = await sb
        .from("team_members")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true });
      return { data: (data ?? []) as TeamMemberRow[], error };
    },
    demo.demoTeam,
    "team_members",
  );
}

// ---------------------------------------------------------------- Activity feed
export async function getActivityFeed(limit = 6): Promise<ActivityFeedRow[]> {
  return query<ActivityFeedRow[]>(
    async (sb) => {
      const { data, error } = await sb
        .from("activity_feed")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(limit);
      return { data: (data ?? []) as ActivityFeedRow[], error };
    },
    demo.demoActivity.slice(0, limit),
    "activity_feed",
  );
}

// ---------------------------------------------------------------- Social links
export async function getSocialLinks(): Promise<SocialLinkRow[]> {
  return query<SocialLinkRow[]>(
    async (sb) => {
      const { data, error } = await sb
        .from("social_links")
        .select("*")
        .order("display_order", { ascending: true });
      return { data: (data ?? []) as SocialLinkRow[], error };
    },
    demo.demoSocialLinks,
    "social_links",
  );
}

// ---------------------------------------------------------------- Blog
export async function getBlogCategories(): Promise<BlogCategoryRow[]> {
  return query<BlogCategoryRow[]>(
    async (sb) => {
      const { data, error } = await sb
        .from("blog_categories")
        .select("*")
        .order("display_order", { ascending: true });
      return { data: (data ?? []) as BlogCategoryRow[], error };
    },
    demo.demoBlogCategories,
    "blog_categories",
  );
}

export async function getBlogPosts(opts?: {
  categorySlug?: string;
  featuredOnly?: boolean;
  limit?: number;
}): Promise<BlogPostRow[]> {
  let fallback = demo.demoBlogPosts;
  if (opts?.categorySlug) {
    const cat = demo.demoBlogCategories.find((c) => c.slug === opts.categorySlug);
    if (cat) fallback = fallback.filter((p) => p.category_id === cat.id);
  }
  if (opts?.featuredOnly) fallback = fallback.filter((p) => p.featured);
  if (opts?.limit) fallback = fallback.slice(0, opts.limit);

  return query<BlogPostRow[]>(
    async (sb) => {
      let q = sb
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (opts?.featuredOnly) q = q.eq("featured", true);
      if (opts?.limit) q = q.limit(opts.limit);
      if (opts?.categorySlug) {
        const { data: cat } = await sb
          .from("blog_categories")
          .select("id")
          .eq("slug", opts.categorySlug)
          .maybeSingle<{ id: string }>();
        if (cat?.id) q = q.eq("category_id", cat.id);
      }
      const { data, error } = await q;
      return { data: (data ?? []) as BlogPostRow[], error };
    },
    fallback,
    "blog_posts",
  );
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostRow | null> {
  const fallback = demo.demoBlogPosts.find((p) => p.slug === slug) ?? null;
  return query<BlogPostRow | null>(
    async (sb) => {
      const { data, error } = await sb
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      return { data: data as BlogPostRow | null, error };
    },
    fallback,
    "blog_post_by_slug",
  );
}
