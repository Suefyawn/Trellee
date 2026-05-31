import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { ServiceForm } from "@/components/admin/service-form";

export default function NewServicePage() {
  return (
    <>
      <AdminPageHeader
        title="New service"
        back={{ href: "/admin/services", label: "Services" }}
      />
      <AdminPageBody>
        <ServiceForm />
      </AdminPageBody>
    </>
  );
}
