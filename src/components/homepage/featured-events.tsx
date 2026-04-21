import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { EventCard } from "@/components/events/event-card";
import type { Event } from "@/types";

export async function FeaturedEvents() {
  let events: Event[] = [];

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await queryWithRetry(
      () =>
        supabase
          .from("events")
          .select("*")
          .eq("status", "approved")
          .gte("start_date", today)
          .order("start_date", { ascending: true })
          .limit(4),
      "homepage-events"
    );

    if (error) console.error("Homepage events query error:", error);
    events = (data ?? []) as Event[];
  } catch {
    // Supabase unreachable
  }

  if (events.length > 0) {
    return (
      <div className="mt-10 space-y-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-0 divide-y divide-brand-gold/20">
      <div className="flex gap-5 py-5">
        <div className="flex w-14 shrink-0 flex-col items-center rounded bg-brand-deep-green px-2 py-1.5 text-center text-brand-cream">
          <span className="text-xs font-semibold uppercase leading-tight">Soon</span>
          <span className="text-xl font-bold leading-tight">...</span>
        </div>
        <div>
          <h3 className="font-serif text-lg font-medium text-brand-charcoal">
            Events coming soon
          </h3>
          <p className="mt-1 text-sm text-brand-charcoal-light">
            Submit your event to be among the first listed on The Ubudian.
          </p>
        </div>
      </div>
    </div>
  );
}
