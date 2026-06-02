import { EventCardSkeleton } from "@/components/skeletons/event-card-skeleton";
import { EventsHero } from "@/components/events/events-hero";

/**
 * Streaming skeleton for `/events`. MUST render the same compact `EventsHero`
 * band as `events/page.tsx` (and the same `max-w-7xl px-4 py-8` list container)
 * so there is zero layout shift when the real page streams in. Previously this
 * rendered the tall `<PageHero>` (`min-h-[100dvh]`), which collapsed to the
 * compact hero on every navigation — a visible header flash.
 */
export default function EventsLoading() {
  return (
    <div>
      <EventsHero />
      <section className="mx-auto min-w-0 max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
