import { EventCard } from "./event-card";
import { EventListEmptyState } from "./event-list-empty-state";
import { SaveEventButton } from "@/components/dashboard/save-event-button";
import { groupEventsByTimeBucket } from "@/lib/utils";
import type { Event } from "@/types";

interface EventListProps {
  events: Event[];
  currentProfileId?: string | null;
  savedEventIds?: string[];
}

export function EventList({ events, currentProfileId, savedEventIds }: EventListProps) {
  if (events.length === 0) {
    return <EventListEmptyState />;
  }

  const buckets = groupEventsByTimeBucket(events);
  const savedSet = new Set(savedEventIds ?? []);

  return (
    <div className="space-y-8">
      {buckets.map(({ bucket, events: bucketEvents }) => (
        <section key={bucket}>
          <h2 className="mb-3 font-serif text-xl font-medium text-brand-deep-green">
            {bucket}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {bucketEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                saveButton={
                  currentProfileId ? (
                    <SaveEventButton
                      eventId={event.id}
                      profileId={currentProfileId}
                      initialSaved={savedSet.has(event.id)}
                    />
                  ) : undefined
                }
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
