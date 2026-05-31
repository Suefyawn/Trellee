import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { ProjectForm } from "@/components/admin/project-form";
import { getServices } from "@/lib/cms";

export default async function NewProjectPage() {
  const services = await getServices();
  return (
    <>
      <AdminPageHeader
        title="New project"
        back={{ href: "/admin/projects", label: "Projects" }}
      />
      <AdminPageBody>
        <ProjectForm services={services} />
      </AdminPageBody>
    </>
  );
}
