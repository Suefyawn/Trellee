"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "./guard";

export type PricingTierInput = {
  id?: string;
  service_id: string;
  name: string;
  price: string;
  price_suffix?: string;
  description?: string;
  features?: string[];
  highlighted: boolean;
  cta_label?: string;
  cta_href?: string;
  display_order: number;
};

export async function upsertPricingTier(input: PricingTierInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    service_id: input.service_id,
    name: input.name,
    price: input.price,
    price_suffix: input.price_suffix || null,
    description: input.description || null,
    features: input.features ?? [],
    highlighted: input.highlighted,
    cta_label: input.cta_label || "Book a call",
    cta_href: input.cta_href || "/book",
    display_order: input.display_order,
  };
  if (input.id) {
    const { error } = await sb.from("pricing_tiers").update(payload).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await sb.from("pricing_tiers").insert(payload);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/services");
  revalidatePath("/services");
  return { ok: true as const };
}

export async function deletePricingTier(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("pricing_tiers").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/services");
  revalidatePath("/services");
  return { ok: true as const };
}
