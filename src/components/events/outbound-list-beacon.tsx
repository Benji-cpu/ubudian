"use client";

import { useEffect } from "react";
import { getAnonId } from "@/lib/events/anon-id";

/**
 * The list-page version of `OutboundClickBeacon`: counts taps on any link
 * marked `data-signal-event="<event id>"` (a timetable row's ticket or listing
 * link) as a ticket click, once a day per reader, so readers who go straight
 * from /ubud-tonight to the tickets are counted like those on an event page.
 * One listener for the whole page; the links stay plain anchors.
 */
export function OutboundListBeacon() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[data-signal-event]") as HTMLAnchorElement | null;
      const eventId = a?.dataset.signalEvent;
      if (!eventId) return;
      const anonId = getAnonId();
      if (!anonId) return;
      const body = JSON.stringify({ event_id: eventId, kind: "ticket_click", anon_id: anonId });
      try {
        navigator.sendBeacon("/api/events/signal", new Blob([body], { type: "application/json" }));
      } catch {}
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
