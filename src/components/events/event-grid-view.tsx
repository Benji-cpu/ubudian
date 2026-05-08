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

// Deterministically pick a cover-image aspect for each event so the
// desktop masonry layout has natural row offsets without depending on
// random / per-render shuffling.
const ASPECTS = [
  "aspect-[16/10]",
  "aspect-[4/5]",
  "aspect-[1/1]",
  "aspect-[5/4]",
];

function aspectFor(eventId: string): string {
  let h = 0;
  for (let i = 0; i < eventId.length; i += 1) {
    h = (h * 31 + eventId.charCodeAt(i)) | 0;
  }
  return ASPECTS[Math.abs(h) % ASPECTS.length];
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
      // CSS columns creates a true masonry: cards keep their natural
      // height and pack into balanced columns. `break-inside-avoid` on
      // each card prevents mid-card column breaks.
      containerClassName="columns-1 sm:columns-2 lg:columns-2 [column-gap:1.5rem] [column-fill:_balance]"
      emptyState={<EventListEmptyState />}
      renderSkeleton={() => (
        <div className="mb-6 break-inside-avoid">
          <EventCardSkeleton />
        </div>
      )}
      renderItem={(event) => (
        <div key={event.id} className="mb-6 break-inside-avoid">
          <EventGridCard
            event={event}
            aspectClass={aspectFor(event.id)}
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
        </div>
      )}
    />
  );
}
