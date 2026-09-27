import { createClient } from "@/lib/supabase/server";
import { BookingsList } from "@/components/admin/commerce/bookings-list";
import type { BookingWithTour } from "@/components/admin/commerce/bookings-list";

export default async function AdminCommercePage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("bookings")
    .select("*, tours(title)")
    .order("created_at", { ascending: false });

  const bookings = (data ?? []) as BookingWithTour[];

  return (
    <div>
      <h1 className="text-3xl font-bold">Bookings</h1>

      <div className="mt-6">
        <BookingsList bookings={bookings} />
      </div>
    </div>
  );
}
