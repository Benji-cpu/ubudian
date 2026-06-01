"use client";

import { useMemo } from "react";
import { EventCard } from "./event-card";
import { EventListEmptyState } from "./event-list-empty-state";
import { SaveEventButton } from "@/components/dashboard/save-event-button";
import {
  PaginatedEvents,
  EventRowSkeleton,
} from "./paginated-events";
import { groupEventsByDate } from "@/lib/events/group-by-date";
import type { Event } from "@/types";

interface EventListProps {
  events: Event[];
  currentProfileId?: string | null;
  savedEventIds?: string[];
}

type ListRow =
  | { kind: "header"; label: string; id: string }
  | { kind: "event"; event: Event; id: string };

export function EventList({
  events,
  currentProfileId,
  savedEventIds,
}: EventListProps) {
  const savedSet = new Set(savedEventIds ?? []);

  const rows: ListRow[] = useMemo(() => {
    const out: ListRow[] = [];
    for (const group of groupEventsByDate(events)) {
      out.push({ kind: "header", label: group.label, id: `header-${group.dateKey}` });
      for (const event of group.events) {
        out.push({ kind: "event", event, id: `${event.id}-${group.dateKey}` });
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
              className="mt-8 mb-2 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-deep-green first:mt-1 dark:text-brand-gold"
            >
              <span className="whitespace-nowrap">{row.label}</span>
              <span
                aria-hidden
                className="h-px flex-1 bg-brand-deep-green/15 dark:bg-brand-gold/20"
              />
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
