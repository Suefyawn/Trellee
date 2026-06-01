import Link from "next/link";
import { Plus } from "lucide-react";
import { getServices } from "@/lib/cms";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { ServicesReorder } from "@/components/admin/services-reorder";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const services = await getServices();
  return (
    <>
      <AdminPageHeader
        title="Services"
        description="The disciplines shown on the homepage bento + /services. Drag to reorder; the order drives the homepage layout. Open one to edit its content and tile size."
        actions={
          <Link href="/admin/services/new" className="btn btn-primary">
            <Plus className="w-4 h-4" /> New service
          </Link>
        }
      />
      <AdminPageBody>
        <ServicesReorder services={services} />
      </AdminPageBody>
    </>
  );
}
