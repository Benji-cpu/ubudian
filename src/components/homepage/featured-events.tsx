import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { EventCard } from "@/components/events/event-card";
import { getActiveBoostedEventIds } from "@/lib/sponsors/sponsor-service";
import type { Event } from "@/types";

export async function FeaturedEvents() {
  let events: Event[] = [];

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];
    // Pull a slightly larger window than we'll show so a boosted event from
    // the next few days can outsort a sooner non-boosted one and still surface.
    const { data, error } = await queryWithRetry(
      () =>
        supabase
          .from("events")
          .select("*")
          .eq("status", "approved")
          .gte("start_date", today)
          .order("start_date", { ascending: true })
          .limit(12),
      "homepage-events"
    );

    if (error) console.error("Homepage events query error:", error);
    const candidates = (data ?? []) as Event[];

    const boostedIds = await getActiveBoostedEventIds();
    // Boosted events sort to the front; among themselves and within the
    // remainder, preserve the DB's start_date order.
    events = [...candidates]
      .sort((a, b) => {
        const aBoost = boostedIds.has(a.id) ? 1 : 0;
        const bBoost = boostedIds.has(b.id) ? 1 : 0;
        if (aBoost !== bBoost) return bBoost - aBoost;
        return a.start_date.localeCompare(b.start_date);
      })
      .slice(0, 4);
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
