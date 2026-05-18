"use client";

import { useMemo } from "react";
import { EventCard } from "./event-card";
import { EventListEmptyState } from "./event-list-empty-state";
import { SaveEventButton } from "@/components/dashboard/save-event-button";
import {
  PaginatedEvents,
  EventRowSkeleton,
} from "./paginated-events";
import { bucketEventsByTime, type EventBucket } from "@/lib/events/buckets";
import type { Event } from "@/types";

interface EventListProps {
  events: Event[];
  currentProfileId?: string | null;
  savedEventIds?: string[];
}

type BucketLabel = string;

type ListRow =
  | { kind: "header"; bucket: BucketLabel; id: string }
  | { kind: "event"; event: Event; id: string };

const BUCKET_ORDER: EventBucket[] = [
  "happening_now",
  "today",
  "tomorrow",
  "in_progress",
  "weekend",
  "next_week",
  "later",
];

const BUCKET_LABEL: Record<EventBucket, string> = {
  happening_now: "Happening now",
  today: "Today",
  tomorrow: "Tomorrow",
  in_progress: "Running this week",
  weekend: "This weekend",
  next_week: "Next week",
  later: "Later this month and beyond",
};

export function EventList({
  events,
  currentProfileId,
  savedEventIds,
}: EventListProps) {
  const savedSet = new Set(savedEventIds ?? []);

  const rows: ListRow[] = useMemo(() => {
    const buckets = bucketEventsByTime(events);
    const out: ListRow[] = [];
    for (const key of BUCKET_ORDER) {
      const bucketEvents = buckets[key];
      if (bucketEvents.length === 0) continue;
      const label = BUCKET_LABEL[key];
      out.push({ kind: "header", bucket: label, id: `header-${key}` });
      for (const event of bucketEvents) {
        out.push({ kind: "event", event, id: `${event.id}-${key}` });
      }
    }
    return out;
  }, [events]);

  return (
    <PaginatedEvents
      items={rows}
      pageSize={32}
      containerClassName="space-y-3"
      emptyState={<EventListEmptyState />}
      renderSkeleton={() => <EventRowSkeleton />}
      renderItem={(row) => {
        if (row.kind === "header") {
          return (
            <h2
              key={row.id}
              className="mt-8 mb-1 first:mt-0 font-serif text-xl font-medium text-brand-deep-green"
            >
              {row.bucket}
            </h2>
          );
        }
        return (
          <div key={row.id}>
            <EventCard
              event={row.event}
              saveButton={
                currentProfileId ? (
                  <SaveEventButton
                    eventId={row.event.id}
                    profileId={currentProfileId}
                    initialSaved={savedSet.has(row.event.id)}
                  />
                ) : undefined
              }
            />
          </div>
        );
      }}
    />
  );
}
