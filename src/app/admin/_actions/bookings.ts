"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "./guard";
import { actionError } from "@/lib/action-error";

export type BookingStatus =
  | "new"
  | "contacted"
  | "scheduled"
  | "won"
  | "lost"
  | "cancelled";

export async function updateBookingStatus(id: string, status: BookingStatus) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("bookings").update({ status }).eq("id", id);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function deleteBooking(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("bookings").delete().eq("id", id);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return { ok: true as const };
}
