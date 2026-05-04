"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { EventList } from "@/components/events/event-list";
import { EventGridView } from "@/components/events/event-grid-view";
import { EventCalendar } from "@/components/events/event-calendar";
import { EventWeekView } from "@/components/events/event-week-view";
import { matchesPriceBracket, type PriceBracket } from "@/lib/price-parser";
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
  const hasImageOnly = searchParams.get("hasImage") === "true";

  const filtered = useMemo(() => {
    let out = events;
    if (priceBracket) {
      out = out.filter((e) => matchesPriceBracket(e.price_info, priceBracket));
    }
    if (freeOnly) {
      out = out.filter((e) => matchesPriceBracket(e.price_info, "free"));
    }
    if (hasImageOnly) {
      out = out.filter((e) => !!e.cover_image_url);
    }
    return out;
  }, [events, priceBracket, freeOnly, hasImageOnly]);

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
