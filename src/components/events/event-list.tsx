import { EventCard } from "./event-card";
import { EventListEmptyState } from "./event-list-empty-state";
import { groupEventsByTimeBucket } from "@/lib/utils";
import type { Event } from "@/types";

interface EventListProps {
  events: Event[];
}

export function EventList({ events }: EventListProps) {
  if (events.length === 0) {
    return <EventListEmptyState />;
  }

  const buckets = groupEventsByTimeBucket(events);

  return (
    <div className="space-y-8">
      {buckets.map(({ bucket, events: bucketEvents }) => (
        <section key={bucket}>
          <h2 className="mb-3 font-serif text-xl font-medium text-brand-deep-green">
            {bucket}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {bucketEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
