"use client";

import { EventGridCard } from "./event-grid-card";
import { EventListEmptyState } from "./event-list-empty-state";
import { SaveEventButton } from "@/components/dashboard/save-event-button";
import {
  PaginatedEvents,
  EventCardSkeleton,
} from "./paginated-events";
import type { Event } from "@/types";

interface EventGridViewProps {
  events: Event[];
  currentProfileId?: string | null;
  savedEventIds?: string[];
}

export function EventGridView({
  events,
  currentProfileId,
  savedEventIds,
}: EventGridViewProps) {
  const savedSet = new Set(savedEventIds ?? []);

  return (
    <PaginatedEvents
      items={events}
      pageSize={24}
      containerClassName="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      emptyState={<EventListEmptyState />}
      renderSkeleton={() => <EventCardSkeleton />}
      renderItem={(event) => (
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
      )}
    />
  );
}
