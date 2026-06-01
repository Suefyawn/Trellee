import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { TableFilter } from "@/components/admin/table-filter";
import { demoReviews } from "@/lib/cms/demo-data";
import type { ReviewRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function getAllReviews(): Promise<ReviewRow[]> {
  if (!isSupabaseConfigured()) return demoReviews;
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("reviews")
    .select("*")
    .order("display_order", { ascending: true });
  return (data ?? []) as ReviewRow[];
}

export default async function AdminReviewsPage() {
  const reviews = await getAllReviews();
  return (
    <>
      <AdminPageHeader
        title="Reviews"
        description="Text and video testimonials. Featured reviews appear on the homepage."
        actions={
          <div className="flex items-center gap-2">
            <TableFilter targetId="reviews-list" placeholder="Filter reviews…" />
            <Link href="/admin/reviews/new" className="btn btn-primary">
              <Plus className="w-4 h-4" /> New review
            </Link>
          </div>
        }
      />
      <AdminPageBody>
        <div id="reviews-list" className="grid md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <Link
              key={r.id}
              data-row
              href={`/admin/reviews/${r.id}`}
              className="surface-card p-6 group hover:border-border-strong transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${
                      r.type === "video" ? "badge-brand" : ""
                    }`}
                  >
                    {r.type}
                  </span>
                  {r.featured ? (
                    <span className="badge badge-brand">featured</span>
                  ) : null}
                </div>
                <div className="flex items-center">
                  {Array.from({ length: r.rating ?? 0 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 text-brand-500 fill-brand-500"
                    />
                  ))}
                </div>
              </div>
              <h3 className="t-heading-l font-display mt-4">
                {r.author_name}
              </h3>
              <div className="t-mono text-muted text-xs">
                {[r.author_role, r.author_company].filter(Boolean).join(" · ")}
              </div>
              {r.quote ? (
                <p className="t-small text-muted mt-4 line-clamp-3">
                  &ldquo;{r.quote}&rdquo;
                </p>
              ) : null}
              {r.type === "video" && r.video_url ? (
                <p className="t-mono text-muted text-xs mt-4 truncate">
                  {r.video_url}
                </p>
              ) : null}
            </Link>
          ))}
          <div
            id="reviews-list-empty"
            style={{ display: "none" }}
            className="t-small text-muted p-4 md:col-span-2"
          >
            No matches.
          </div>
        </div>
      </AdminPageBody>
    </>
  );
}
