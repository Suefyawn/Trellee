import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { PmProjectForm } from "@/components/admin/pm-project-form";

export const dynamic = "force-dynamic";

export default function NewPmProjectPage() {
  return (
    <>
      <AdminPageHeader
        title="New project"
        description="Create a project, then add tasks on the next screen."
        back={{ href: "/admin/pm", label: "Projects" }}
      />
      <AdminPageBody>
        <PmProjectForm />
      </AdminPageBody>
    </>
  );
}
