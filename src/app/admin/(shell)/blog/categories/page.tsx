import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { CategoriesEditor } from "@/components/admin/categories-editor";
import { demoBlogCategories } from "@/lib/cms/demo-data";
import type { BlogCategoryRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function getCategories(): Promise<BlogCategoryRow[]> {
  if (!isSupabaseConfigured()) return demoBlogCategories;
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("blog_categories")
    .select("*")
    .order("display_order");
  return (data ?? []) as BlogCategoryRow[];
}

export default async function BlogCategoriesPage() {
  const categories = await getCategories();
  return (
    <>
      <AdminPageHeader
        title="Blog categories"
        description="Chips shown on the /blog filter rail. Slug becomes the URL param."
        back={{ href: "/admin/blog/posts", label: "Posts" }}
      />
      <AdminPageBody>
        <CategoriesEditor initial={categories} />
      </AdminPageBody>
    </>
  );
}
