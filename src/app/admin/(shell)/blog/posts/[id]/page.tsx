import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteBlogPostAction } from "@/app/admin/_actions/wrappers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getBlogCategories, getTeamMembers } from "@/lib/cms";
import type { BlogPostRow } from "@/lib/types/database";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return (
      <>
        <AdminPageHeader
          title="Post"
          back={{ href: "/admin/blog/posts", label: "Posts" }}
        />
        <AdminPageBody>
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-5">
            <h3 className="t-heading-l font-display">Supabase isn&apos;t connected.</h3>
            <Link href="/admin" className="btn btn-secondary mt-4 inline-flex">
              Back to dashboard
            </Link>
          </div>
        </AdminPageBody>
      </>
    );
  }

  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle<BlogPostRow>();
  if (!data) notFound();

  const [categories, authors] = await Promise.all([
    getBlogCategories(),
    getTeamMembers(),
  ]);

  return (
    <>
      <AdminPageHeader
        title={data.title}
        description={`Slug: ${data.slug}`}
        back={{ href: "/admin/blog/posts", label: "Posts" }}
        actions={
          <DeleteButton
            onDelete={deleteBlogPostAction.bind(null, data.id)}
            redirectTo="/admin/blog/posts"
            label="Delete post"
            confirmText="Confirm delete"
          />
        }
      />
      <AdminPageBody>
        <BlogPostForm initial={data} categories={categories} authors={authors} />
      </AdminPageBody>
    </>
  );
}
