import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { InvoiceForm } from "@/components/admin/invoice-form";

export const dynamic = "force-dynamic";

export default function NewInvoicePage() {
  return (
    <>
      <AdminPageHeader
        title="New invoice"
        description="A number is assigned automatically when you save."
        back={{ href: "/admin/invoices", label: "Invoices" }}
      />
      <AdminPageBody>
        <InvoiceForm />
      </AdminPageBody>
    </>
  );
}
