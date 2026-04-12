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
}

export function PriceFilteredEvents({
  events,
  view,
}: PriceFilteredEventsProps) {
  const searchParams = useSearchParams();
  const priceBracket = searchParams.get("price") as PriceBracket | null;

  const filtered = useMemo(() => {
    if (!priceBracket) return events;
    return events.filter((e) => matchesPriceBracket(e.price_info, priceBracket));
  }, [events, priceBracket]);

  if (view === "calendar") return <EventCalendar events={filtered} />;
  if (view === "week") return <EventWeekView events={filtered} />;
  if (view === "grid") return <EventGridView events={filtered} />;
  return <EventList events={filtered} />;
}
