import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { EventCard } from "@/components/events/event-card";
import { getActiveBoostedEventIds } from "@/lib/sponsors/sponsor-service";
import { bucketEventsByTime } from "@/lib/events/buckets";
import { nowInBali } from "@/lib/events/bali-time";
import { stripEmbeddings } from "@/lib/events/strip-embedding";
import type { Event } from "@/types";

const MAX_CARDS = 6;

/**
 * The homepage's one job: what is on tonight. Falls back to the rest of the
 * week, and only then to an honest "nothing listed" — never a fake card.
 *
 * Reads the same rolled-forward buckets as /events, so a weekly class lands
 * here on its day and a one-off lands on its date. (The previous version
 * filtered `start_date >= today` at the DB, which silently excluded every
 * recurring rhythm — the bulk of the agenda — and showed "Events coming soon"
 * whenever no one-off happened to be dated today.)
 */
export async function FeaturedEvents() {
  let tonight: Event[] = [];
  let thisWeek: Event[] = [];
  let boosted = new Set<string>();

  try {
    const supabase = await createClient();
    const today = nowInBali().dateStr;
    const { data, error } = await queryWithRetry(
      () =>
        supabase
          .from("events")
          .select("*")
          .eq("status", "approved")
          .or(`start_date.gte.${today},is_recurring.eq.true,end_date.gte.${today}`),
      "homepage-events"
    );
    if (error) console.error("Homepage events query error:", error);
    boosted = await getActiveBoostedEventIds();

    const buckets = bucketEventsByTime(stripEmbeddings((data ?? []) as Event[]), new Date(), boosted);
    tonight = [...buckets.happening_now, ...buckets.today];
    thisWeek = [...buckets.tomorrow, ...buckets.weekend, ...buckets.next_week];
  } catch {
    // Supabase unreachable — fall through to the honest empty state.
  }

  const showing = tonight.length > 0 ? tonight : thisWeek;
  const heading = tonight.length > 0 ? "Tonight in Ubud" : "This week in Ubud";
  const count = showing.length;

  if (count === 0) {
    return (
      <div className="mt-10 rounded-lg border border-brand-gold/20 bg-brand-cream/60 px-5 py-6 text-center">
        <h3 className="font-serif text-lg font-medium text-brand-charcoal">
          Nothing listed for this week yet
        </h3>
        <p className="mt-2 text-sm text-brand-charcoal-light">
          The agenda is harvested nightly from the venues and ticket sites. If it is empty, something
          upstream has stopped — check back tomorrow, or{" "}
          <Link href="/events/submit" className="underline underline-offset-2 hover:text-brand-gold">
            list what you know is on
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <p className="text-center font-serif text-xs uppercase tracking-[0.25em] text-brand-gold">
        {heading} · {count} {count === 1 ? "gathering" : "gatherings"}
      </p>
      <div className="mt-4 space-y-3">
        {showing.slice(0, MAX_CARDS).map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      {count > MAX_CARDS && (
        <p className="mt-4 text-center text-sm text-brand-charcoal-light">
          <Link href="/events" className="underline underline-offset-2 hover:text-brand-gold">
            {count - MAX_CARDS} more {tonight.length > 0 ? "tonight" : "this week"} →
          </Link>
        </p>
      )}
    </div>
  );
}
