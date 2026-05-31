import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { ReviewForm } from "@/components/admin/review-form";
import { getProjects } from "@/lib/cms";

export default async function NewReviewPage() {
  const projects = await getProjects();
  return (
    <>
      <AdminPageHeader
        title="New review"
        back={{ href: "/admin/reviews", label: "Reviews" }}
      />
      <AdminPageBody>
        <ReviewForm projects={projects} />
      </AdminPageBody>
    </>
  );
}
