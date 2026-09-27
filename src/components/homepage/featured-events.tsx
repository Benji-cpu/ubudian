import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { EventCard } from "@/components/events/event-card";
import { getActiveBoostedEventIds } from "@/lib/sponsors/sponsor-service";
import { bucketEventsByTime } from "@/lib/events/buckets";
import { nowInBali, parseTimeToMinutes } from "@/lib/events/bali-time";
import { stripEmbeddings } from "@/lib/events/strip-embedding";
import type { Event } from "@/types";

const MAX_CARDS = 6;

/** Minutes after its start that a gathering is still worth walking into. */
const JOINABLE_AFTER_START_MIN = 30;

/**
 * The homepage's one job: what is still ahead today. Falls back to the rest
 * of the week, and only then to an honest "nothing listed" — never a fake card.
 *
 * "Still ahead" means you can still get there: not yet started, started in the
 * last half hour, all-day, or a multi-day event. A 4–6pm ceremony is not
 * something to go to at 5pm, and an 8am class is not "tonight".
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
  const bali = nowInBali();

  try {
    const supabase = await createClient();
    const today = bali.dateStr;
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
    const stillJoinable = buckets.happening_now.filter((e) => {
      if (e.end_date && e.end_date > e.start_date) return true;
      const start = parseTimeToMinutes(e.start_time);
      return start === null || bali.timeMinutes - start <= JOINABLE_AFTER_START_MIN;
    });
    tonight = [...stillJoinable, ...buckets.today];
    thisWeek = [...buckets.tomorrow, ...buckets.weekend, ...buckets.next_week];
  } catch {
    // Supabase unreachable — fall through to the honest empty state.
  }

  const showing = tonight.length > 0 ? tonight : thisWeek;
  const heading =
    tonight.length > 0
      ? bali.timeMinutes >= 16 * 60
        ? "Still ahead tonight"
        : "Still ahead today"
      : "Coming up this week";
  const count = showing.length;

  if (count === 0) {
    return (
      <div className="mt-10 rounded-lg border border-brand-gold/20 bg-brand-cream/60 px-5 py-6 text-center">
        <h3 className="font-serif text-lg font-medium text-brand-charcoal">
          Nothing listed for this week yet
        </h3>
        <p className="mt-2 text-sm text-brand-charcoal-light">
          The calendar is gathered nightly from ticket sites, event boards and community channels. If it is empty, something
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
            {count - MAX_CARDS} more {tonight.length > 0 ? "today" : "this week"} →
          </Link>
        </p>
      )}
    </div>
  );
}
