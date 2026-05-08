"use client";

import { useMemo } from "react";
import { EventCard } from "./event-card";
import { EventListEmptyState } from "./event-list-empty-state";
import { SaveEventButton } from "@/components/dashboard/save-event-button";
import {
  PaginatedEvents,
  EventRowSkeleton,
} from "./paginated-events";
import { groupEventsByTimeBucket } from "@/lib/utils";
import type { Event } from "@/types";

interface EventListProps {
  events: Event[];
  currentProfileId?: string | null;
  savedEventIds?: string[];
}

type BucketLabel = string;

/**
 * Flatten the bucketed events into a single ordered list, but keep
 * the bucket labels so we can interleave section headers between
 * runs of items. This lets the paginator work on a single flat
 * stream while preserving the grouped visual rhythm of the page.
 */
type ListRow =
  | { kind: "header"; bucket: BucketLabel; id: string }
  | { kind: "event"; event: Event; id: string };

export function EventList({
  events,
  currentProfileId,
  savedEventIds,
}: EventListProps) {
  const savedSet = new Set(savedEventIds ?? []);

  const rows: ListRow[] = useMemo(() => {
    const buckets = groupEventsByTimeBucket(events);
    const out: ListRow[] = [];
    for (const { bucket, events: bucketEvents } of buckets) {
      out.push({ kind: "header", bucket, id: `header-${bucket}` });
      for (const event of bucketEvents) {
        out.push({ kind: "event", event, id: event.id });
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
