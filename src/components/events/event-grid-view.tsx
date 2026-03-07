import { EventGridCard } from "./event-grid-card";
import { EventListEmptyState } from "./event-list-empty-state";
import type { Event } from "@/types";

interface EventGridViewProps {
  events: Event[];
}

export function EventGridView({ events }: EventGridViewProps) {
  if (events.length === 0) {
    return <EventListEmptyState />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventGridCard key={event.id} event={event} />
      ))}
    </div>
  );
}
