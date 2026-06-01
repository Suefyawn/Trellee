import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/admin/print-button";
import type { InvoiceRow, SiteSettingsRow } from "@/lib/types/database";
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

export default async function InvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) notFound();

  const sb = createSupabaseAdminClient();
  const [{ data: invoice }, { data: settings }] = await Promise.all([
    sb.from("invoices").select("*").eq("id", id).maybeSingle<InvoiceRow>(),
    sb.from("site_settings").select("*").eq("id", 1).maybeSingle<SiteSettingsRow>(),
  ]);
  if (!invoice) notFound();

  const subtotal = invoice.line_items.reduce(
    (s, li) => s + (Number(li.quantity) || 0) * (Number(li.unit_price) || 0),
    0,
  );
  const taxAmount = subtotal * ((Number(invoice.tax_rate) || 0) / 100);
  const company = settings?.company_name ?? "Trellee";

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Toolbar — hidden when printing */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link
          href={`/admin/invoices/${invoice.id}`}
          className="t-mono text-muted hover:text-fg transition inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to invoice
        </Link>
        <PrintButton />
      </div>

      {/* The invoice sheet — white so it prints cleanly */}
      <article className="invoice-sheet bg-white text-neutral-900 rounded-xl border border-border print:border-0 p-8 lg:p-12 shadow-sm">
        <header className="flex items-start justify-between gap-6 border-b border-neutral-200 pb-6">
          <div>
            <div className="text-2xl font-semibold tracking-tight">
              {company}<span className="text-emerald-500">.</span>
            </div>
            <div className="text-sm text-neutral-500 mt-2 space-y-0.5">
              {settings?.email ? <div>{settings.email}</div> : null}
              {settings?.city ? <div>{settings.city}</div> : null}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Invoice</div>
            <div className="text-xl font-mono mt-1">{invoice.number}</div>
            <div className="text-sm text-neutral-500 mt-2 uppercase">{invoice.status}</div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 mt-6 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-neutral-400 mb-1">Bill to</div>
            <div className="font-medium">{invoice.client_name}</div>
            {invoice.client_company ? <div>{invoice.client_company}</div> : null}
            {invoice.client_email ? (
              <div className="text-neutral-500">{invoice.client_email}</div>
            ) : null}
            {invoice.client_address ? (
              <div className="text-neutral-500 whitespace-pre-wrap">{invoice.client_address}</div>
            ) : null}
          </div>
          <div className="text-right">
            <div className="text-neutral-500">
              <span className="text-neutral-400">Issued:</span> {formatDate(invoice.issue_date)}
            </div>
            {invoice.due_date ? (
              <div className="text-neutral-500">
                <span className="text-neutral-400">Due:</span> {formatDate(invoice.due_date)}
              </div>
            ) : null}
          </div>
        </section>

        <table className="w-full mt-8 text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-400">
              <th className="py-2 font-normal">Description</th>
              <th className="py-2 font-normal text-right">Qty</th>
              <th className="py-2 font-normal text-right">Unit price</th>
              <th className="py-2 font-normal text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((li, i) => (
              <tr key={i} className="border-b border-neutral-100">
                <td className="py-3 pr-2">{li.description}</td>
                <td className="py-3 text-right tabular-nums">{li.quantity}</td>
                <td className="py-3 text-right tabular-nums">
                  {money(Number(li.unit_price) || 0, invoice.currency)}
                </td>
                <td className="py-3 text-right tabular-nums">
                  {money((Number(li.quantity) || 0) * (Number(li.unit_price) || 0), invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-6">
          <div className="w-64 text-sm space-y-1.5">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span className="tabular-nums">{money(subtotal, invoice.currency)}</span>
            </div>
            {invoice.tax_rate ? (
              <div className="flex justify-between text-neutral-500">
                <span>Tax ({invoice.tax_rate}%)</span>
                <span className="tabular-nums">{money(taxAmount, invoice.currency)}</span>
              </div>
            ) : null}
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-neutral-200">
              <span>Total</span>
              <span className="tabular-nums">{money(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {invoice.notes ? (
          <footer className="mt-10 pt-6 border-t border-neutral-200 text-sm text-neutral-500 whitespace-pre-wrap">
            {invoice.notes}
          </footer>
        ) : null}
      </article>
    </div>
  );
}
