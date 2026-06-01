"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "./guard";
import type { InvoiceLineItem } from "@/lib/types/database";

export type InvoiceInput = {
  id?: string;
  status: "draft" | "sent" | "paid" | "void";
  client_name: string;
  client_email?: string;
  client_company?: string;
  client_address?: string;
  issue_date: string;
  due_date?: string;
  currency: string;
  line_items: InvoiceLineItem[];
  tax_rate: number;
  notes?: string;
};

/** Subtotal + tax → grand total, rounded to cents. */
function computeInvoiceTotal(
  lineItems: InvoiceLineItem[],
  taxRate: number,
): number {
  const subtotal = lineItems.reduce(
    (sum, li) => sum + (Number(li.quantity) || 0) * (Number(li.unit_price) || 0),
    0,
  );
  const total = subtotal * (1 + (Number(taxRate) || 0) / 100);
  return Math.round(total * 100) / 100;
}

/** Next sequential invoice number, e.g. INV-0007. */
async function nextInvoiceNumber(
  sb: ReturnType<typeof createSupabaseAdminClient>,
): Promise<string> {
  const { data } = await sb.from("invoices").select("number");
  const max = (data ?? []).reduce((m, r) => {
    const n = parseInt(String((r as { number: string }).number).replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `INV-${String(max + 1).padStart(4, "0")}`;
}

export async function upsertInvoice(input: InvoiceInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();

  const lineItems = (input.line_items ?? []).filter((li) => li.description?.trim());
  const total = computeInvoiceTotal(lineItems, input.tax_rate);

  const payload = {
    status: input.status,
    client_name: input.client_name.trim(),
    client_email: input.client_email?.trim() || null,
    client_company: input.client_company?.trim() || null,
    client_address: input.client_address?.trim() || null,
    issue_date: input.issue_date,
    due_date: input.due_date || null,
    currency: input.currency || "USD",
    line_items: lineItems,
    tax_rate: Number(input.tax_rate) || 0,
    notes: input.notes?.trim() || null,
    total,
  };

  let id = input.id;
  if (id) {
    const { error } = await sb.from("invoices").update(payload).eq("id", id);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const number = await nextInvoiceNumber(sb);
    const { data, error } = await sb
      .from("invoices")
      .insert({ ...payload, number })
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error) return { ok: false as const, error: error.message };
    id = data?.id;
  }
  revalidatePath("/admin/invoices");
  if (id) revalidatePath(`/admin/invoices/${id}`);
  return { ok: true as const, id };
}

export async function updateInvoiceStatus(
  id: string,
  status: "draft" | "sent" | "paid" | "void",
) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("invoices").update({ status }).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${id}`);
  return { ok: true as const };
}

export async function deleteInvoice(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("invoices").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/invoices");
  return { ok: true as const };
}
