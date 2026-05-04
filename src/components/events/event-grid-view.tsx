import { EventGridCard } from "./event-grid-card";
import { EventListEmptyState } from "./event-list-empty-state";
import { SaveEventButton } from "@/components/dashboard/save-event-button";
import type { Event } from "@/types";

interface EventGridViewProps {
  events: Event[];
  currentProfileId?: string | null;
  savedEventIds?: string[];
}

export function EventGridView({ events, currentProfileId, savedEventIds }: EventGridViewProps) {
  if (events.length === 0) {
    return <EventListEmptyState />;
  }

  const savedSet = new Set(savedEventIds ?? []);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventGridCard
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
  );
}
