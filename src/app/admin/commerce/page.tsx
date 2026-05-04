import { createClient } from "@/lib/supabase/server";
import { CommerceTabs } from "@/components/admin/commerce/commerce-tabs";
import type { BookingWithTour } from "@/components/admin/commerce/bookings-list";
import type { SubscriptionWithProfile } from "@/components/admin/commerce/subscriptions-list";

export default async function AdminCommercePage() {
  const supabase = await createClient();

  const [bookingsRes, subscriptionsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, tours(title)")
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("*, profiles(display_name, email)")
      .order("created_at", { ascending: false }),
  ]);

  const bookings = (bookingsRes.data ?? []) as BookingWithTour[];
  const subscriptions = (subscriptionsRes.data ?? []) as SubscriptionWithProfile[];

  return (
    <div>
      <h1 className="text-3xl font-bold">Commerce</h1>

      <div className="mt-6">
        <CommerceTabs bookings={bookings} subscriptions={subscriptions} />
      </div>
    </div>
  );
}
