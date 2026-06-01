import Link from "next/link";
import { Plus } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import type { InvoiceRow } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

const STATUS_BADGE: Record<string, string> = {
  paid: "badge-brand",
  sent: "",
  draft: "",
  void: "",
};

export default async function AdminInvoicesPage() {
  let invoices: InvoiceRow[] = [];
  if (isSupabaseConfigured()) {
    const sb = createSupabaseAdminClient();
    const { data } = await sb
      .from("invoices")
      .select("*")
      .order("issue_date", { ascending: false })
      .order("number", { ascending: false });
    invoices = (data ?? []) as InvoiceRow[];
  }

  return (
    <>
      <AdminPageHeader
        title="Invoices"
        description="Create and manage invoices. Open one to view a printable copy (Save as PDF)."
        actions={
          <Link href="/admin/invoices/new" className="btn btn-primary">
            <Plus className="w-4 h-4" /> New invoice
          </Link>
        }
      />
      <AdminPageBody>
        {invoices.length === 0 ? (
          <div className="surface-card p-8 text-center">
            <p className="t-body text-muted">No invoices yet.</p>
            <Link href="/admin/invoices/new" className="btn btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="surface-card overflow-hidden">
            <table className="w-full t-small">
              <thead>
                <tr className="bg-surface-2/60 t-mono text-muted text-xs uppercase tracking-wider">
                  <th className="text-left p-4 font-normal">Number</th>
                  <th className="text-left p-4 font-normal">Client</th>
                  <th className="text-left p-4 font-normal">Issued</th>
                  <th className="text-left p-4 font-normal">Status</th>
                  <th className="text-right p-4 font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-t border-border hover:bg-surface-2/40 transition"
                  >
                    <td className="p-4">
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="t-mono text-fg hover:text-brand-500 transition"
                      >
                        {inv.number}
                      </Link>
                    </td>
                    <td className="p-4 text-muted">
                      {inv.client_name}
                      {inv.client_company ? (
                        <span className="text-muted/70"> · {inv.client_company}</span>
                      ) : null}
                    </td>
                    <td className="p-4 t-mono text-muted text-xs">
                      {formatDate(inv.issue_date)}
                    </td>
                    <td className="p-4">
                      <span className={`badge ${STATUS_BADGE[inv.status] ?? ""} text-[10px]`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right t-mono">
                      {money(inv.total, inv.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPageBody>
    </>
  );
}
