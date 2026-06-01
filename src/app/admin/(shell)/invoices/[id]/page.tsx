import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteInvoiceAction } from "@/app/admin/_actions/wrappers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { InvoiceRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) notFound();

  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("invoices").select("*").eq("id", id).maybeSingle<InvoiceRow>();
  if (!data) notFound();

  return (
    <>
      <AdminPageHeader
        title={data.number}
        description={`Editing invoice · ${data.client_name}`}
        back={{ href: "/admin/invoices", label: "Invoices" }}
        actions={
          <>
            <Link
              href={`/admin/invoices/${data.id}/view`}
              target="_blank"
              className="btn btn-secondary"
            >
              <Printer className="w-4 h-4" /> View / Print
            </Link>
            <DeleteButton
              onDelete={() => deleteInvoiceAction(data.id)}
              redirectTo="/admin/invoices"
              label="Delete"
              confirmText="Confirm delete"
            />
          </>
        }
      />
      <AdminPageBody>
        <InvoiceForm initial={data} />
      </AdminPageBody>
    </>
  );
}
