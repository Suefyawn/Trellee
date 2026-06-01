import Link from "next/link";
import { Plus } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { demoBlogCategories, demoBlogPosts } from "@/lib/cms/demo-data";
import type { BlogCategoryRow, BlogPostRow } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function getData() {
  if (!isSupabaseConfigured()) {
    return { posts: demoBlogPosts, categories: demoBlogCategories };
  }
  const sb = createSupabaseAdminClient();
  const [posts, categories] = await Promise.all([
    sb.from("blog_posts").select("*").order("published_at", { ascending: false }),
    sb.from("blog_categories").select("*").order("display_order"),
  ]);
  return {
    posts: (posts.data ?? []) as BlogPostRow[],
    categories: (categories.data ?? []) as BlogCategoryRow[],
  };
}

export default async function AdminBlogPostsPage() {
  const { posts, categories } = await getData();
  const catName = (id: string | null) =>
    id ? categories.find((c) => c.id === id)?.name : null;
  return (
    <>
      <AdminPageHeader
        title="Blog posts"
        description="Markdown-friendly long-form notes. Drafts are hidden from the public site."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/blog/categories"
              className="btn btn-secondary"
            >
              Manage categories
            </Link>
            <Link href="/admin/blog/posts/new" className="btn btn-primary">
              <Plus className="w-4 h-4" /> New post
            </Link>
          </div>
        }
      />
      <AdminPageBody>
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[640px] t-small">
            <thead>
              <tr className="bg-surface-2/60 t-mono text-muted text-xs uppercase tracking-wider">
                <th className="text-left p-4 font-normal">Title</th>
                <th className="text-left p-4 font-normal">Category</th>
                <th className="text-left p-4 font-normal">Status</th>
                <th className="text-left p-4 font-normal">Published</th>
                <th className="text-left p-4 font-normal">Featured</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-border hover:bg-surface-2/40 transition"
                >
                  <td className="p-4">
                    <Link
                      href={`/admin/blog/posts/${p.id}`}
                      className="text-fg hover:text-brand-500 transition"
                    >
                      {p.title}
                    </Link>
                    <div className="t-mono text-muted text-xs mt-0.5">{p.slug}</div>
                  </td>
                  <td className="p-4 text-muted">{catName(p.category_id) ?? "—"}</td>
                  <td className="p-4">
                    <span
                      className={`badge ${
                        p.status === "published" ? "badge-brand" : ""
                      } text-[10px]`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 t-mono text-muted text-xs">
                    {p.published_at ? formatDate(p.published_at) : "—"}
                  </td>
                  <td className="p-4">
                    {p.featured ? (
                      <span className="badge badge-brand">featured</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPageBody>
    </>
  );
}
