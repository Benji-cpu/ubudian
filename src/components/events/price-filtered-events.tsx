"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { EventList } from "@/components/events/event-list";
import { EventGridView } from "@/components/events/event-grid-view";
import { EventCalendar } from "@/components/events/event-calendar";
import { EventWeekView } from "@/components/events/event-week-view";
import { filterByPrice, type PriceBracket } from "@/lib/price-parser";
import type { Event } from "@/types";

interface PriceFilteredEventsProps {
  events: Event[];
  view: string;
  currentProfileId?: string | null;
  savedEventIds?: string[];
}

export function PriceFilteredEvents({
  events,
  view,
  currentProfileId,
  savedEventIds,
}: PriceFilteredEventsProps) {
  const searchParams = useSearchParams();
  const priceBracket = searchParams.get("price") as PriceBracket | null;
  const freeOnly = searchParams.get("free") === "true";

  const filtered = useMemo(
    () => filterByPrice(events, priceBracket, freeOnly),
    [events, priceBracket, freeOnly]
  );

  if (view === "calendar") return <EventCalendar events={filtered} />;
  if (view === "week") return <EventWeekView events={filtered} />;
  if (view === "grid")
    return (
      <EventGridView
        events={filtered}
        currentProfileId={currentProfileId}
        savedEventIds={savedEventIds}
      />
    );
  return (
    <EventList
      events={filtered}
      currentProfileId={currentProfileId}
      savedEventIds={savedEventIds}
    />
  );
}
