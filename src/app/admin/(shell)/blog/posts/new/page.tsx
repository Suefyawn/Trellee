import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { getBlogCategories, getTeamMembers } from "@/lib/cms";

export default async function NewBlogPostPage() {
  const [categories, authors] = await Promise.all([
    getBlogCategories(),
    getTeamMembers(),
  ]);
  return (
    <>
      <AdminPageHeader
        title="New post"
        back={{ href: "/admin/blog/posts", label: "Posts" }}
      />
      <AdminPageBody>
        <BlogPostForm categories={categories} authors={authors} />
      </AdminPageBody>
    </>
  );
}
