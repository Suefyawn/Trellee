import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { BookingsTable } from "@/components/admin/bookings-table";
import type { BookingRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function loadBookings(): Promise<BookingRow[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as BookingRow[];
}

export default async function AdminBookingsPage() {
  const bookings = await loadBookings();
  return (
    <>
      <AdminPageHeader
        title="Bookings"
        description="Discovery call requests from /book."
      />
      <AdminPageBody>
        {bookings.length === 0 ? (
          <p className="t-body text-muted">
            No booking submissions yet. They&apos;ll appear here in real time once your
            form is live.
          </p>
        ) : (
          <BookingsTable initial={bookings} />
        )}
      </AdminPageBody>
    </>
  );
}
