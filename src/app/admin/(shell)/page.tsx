import Link from "next/link";
import {
  Briefcase,
  Calendar,
  Inbox,
  Newspaper,
  Receipt,
  Star,
  Workflow,
} from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { formatDate } from "@/lib/utils";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function getCounts() {
  if (!isSupabaseConfigured()) return null;
  const sb = createSupabaseAdminClient();
  const tables = [
    "services",
    "projects",
    "reviews",
    "blog_posts",
    "bookings",
    "contact_submissions",
  ] as const;
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const { count } = await sb.from(t).select("id", { count: "exact", head: true });
    counts[t] = count ?? 0;
  }
  return counts;
}

async function getStatusStrip() {
  if (!isSupabaseConfigured()) return null;
  const sb = createSupabaseAdminClient();
  const head = { count: "exact" as const, head: true };
  const [active, down, newBookings, newLeads] = await Promise.all([
    sb.from("monitored_sites").select("id", head).eq("active", true),
    sb.from("monitored_sites").select("id", head).eq("active", true).eq("is_up", false),
    sb.from("bookings").select("id", head).eq("pipeline_stage", "new"),
    sb.from("contact_submissions").select("id", head).eq("pipeline_stage", "new"),
  ]);
  return {
    sitesActive: active.count ?? 0,
    sitesDown: down.count ?? 0,
    newInbox: (newBookings.count ?? 0) + (newLeads.count ?? 0),
  };
}

async function getRecentBookings(limit = 5) {
  if (!isSupabaseConfigured()) return [];
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("bookings")
    .select("id, name, email, company, status, created_at, service_slug")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

async function getRecentLeads(limit = 5) {
  if (!isSupabaseConfigured()) return [];
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("contact_submissions")
    .select("id, name, email, company, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export default async function AdminDashboard() {
  const [counts, status, bookings, leads] = await Promise.all([
    getCounts(),
    getStatusStrip(),
    getRecentBookings(),
    getRecentLeads(),
  ]);

  const cards = [
    {
      label: "Services",
      href: "/admin/services",
      icon: Briefcase,
      count: counts?.services,
    },
    {
      label: "Projects",
      href: "/admin/projects",
      icon: Workflow,
      count: counts?.projects,
    },
    {
      label: "Reviews",
      href: "/admin/reviews",
      icon: Star,
      count: counts?.reviews,
    },
    {
      label: "Blog posts",
      href: "/admin/blog/posts",
      icon: Newspaper,
      count: counts?.blog_posts,
    },
    {
      label: "Bookings",
      href: "/admin/bookings",
      icon: Calendar,
      count: counts?.bookings,
    },
    {
      label: "Leads",
      href: "/admin/leads",
      icon: Inbox,
      count: counts?.contact_submissions,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Quick overview of inbound work and what's published on the site."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/admin/projects/new" className="btn btn-secondary btn-sm">
              <Workflow className="w-3.5 h-3.5" /> Project
            </Link>
            <Link href="/admin/blog/posts/new" className="btn btn-secondary btn-sm">
              <Newspaper className="w-3.5 h-3.5" /> Post
            </Link>
            <Link href="/admin/invoices/new" className="btn btn-primary btn-sm">
              <Receipt className="w-3.5 h-3.5" /> Invoice
            </Link>
          </div>
        }
      />
      <AdminPageBody>
        {!isSupabaseConfigured() ? (
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-5 mb-8">
            <h3 className="t-heading-l font-display">
              Supabase isn&apos;t configured yet.
            </h3>
            <p className="t-body text-muted mt-2 max-w-2xl">
              The site is rendering with demo data so you can preview the design. To
              start saving real data, copy <span className="t-mono">.env.example</span>{" "}
              to <span className="t-mono">.env.local</span>, fill in the Supabase keys,
              run <span className="t-mono">supabase/migrations/0001_init.sql</span>{" "}
              against your project, and restart the dev server.
            </p>
          </div>
        ) : null}

        {status ? (
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <Link
              href="/admin/monitor"
              className="surface-card p-5 flex items-center justify-between group hover:border-border-strong transition"
            >
              <div>
                <div className="t-mono text-muted text-[11px] uppercase tracking-wider">
                  Site monitor
                </div>
                <div
                  className={`font-display text-2xl mt-2 ${
                    status.sitesDown > 0 ? "text-danger" : ""
                  }`}
                >
                  {status.sitesDown > 0
                    ? `${status.sitesDown} down`
                    : status.sitesActive > 0
                      ? `All ${status.sitesActive} operational`
                      : "No sites yet"}
                </div>
              </div>
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background:
                    status.sitesDown > 0
                      ? "var(--color-danger)"
                      : "var(--color-brand-500)",
                }}
              />
            </Link>
            <Link
              href="/admin/crm"
              className="surface-card p-5 flex items-center justify-between group hover:border-border-strong transition"
            >
              <div>
                <div className="t-mono text-muted text-[11px] uppercase tracking-wider">
                  Inbox · needs attention
                </div>
                <div className="font-display text-2xl mt-2">
                  {status.newInbox} new
                </div>
              </div>
              <Inbox className="w-5 h-5 text-muted" />
            </Link>
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.label}
                href={c.href}
                className="surface-card p-5 group hover:border-border-strong transition"
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-4 h-4 text-muted" />
                  <span className="t-mono text-muted text-xs">→</span>
                </div>
                <div className="font-display text-3xl tracking-tight mt-4">
                  {c.count ?? "—"}
                </div>
                <div className="t-mono text-muted text-[11px] uppercase tracking-wider mt-1">
                  {c.label}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <div className="surface-card">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="t-heading-l font-display">Recent bookings</h3>
              <Link
                href="/admin/bookings"
                className="t-mono text-muted hover:text-fg transition text-xs"
              >
                view all →
              </Link>
            </div>
            {bookings.length === 0 ? (
              <p className="p-5 t-small text-muted">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {bookings.map((b) => (
                  <li key={b.id} className="p-5 flex items-center justify-between">
                    <div>
                      <div className="t-small text-fg">{b.name}</div>
                      <div className="t-mono text-muted text-xs">
                        {b.email}
                        {b.company ? ` · ${b.company}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="badge">{b.status}</div>
                      <div className="t-mono text-muted text-xs mt-1">
                        {formatDate(b.created_at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="surface-card">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="t-heading-l font-display">Recent leads</h3>
              <Link
                href="/admin/leads"
                className="t-mono text-muted hover:text-fg transition text-xs"
              >
                view all →
              </Link>
            </div>
            {leads.length === 0 ? (
              <p className="p-5 t-small text-muted">No contact submissions yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {leads.map((l) => (
                  <li key={l.id} className="p-5 flex items-center justify-between">
                    <div>
                      <div className="t-small text-fg">{l.name}</div>
                      <div className="t-mono text-muted text-xs">
                        {l.email}
                        {l.company ? ` · ${l.company}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="badge">{l.status}</div>
                      <div className="t-mono text-muted text-xs mt-1">
                        {formatDate(l.created_at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </AdminPageBody>
    </>
  );
}
