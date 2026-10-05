"use client";

import { useEffect } from "react";
import { getAnonId } from "@/lib/events/anon-id";

/**
 * Counts clicks on this event's ticket, source and organiser links (once a
 * day per reader) for the events desk. Listens at the document so the links
 * themselves stay plain anchors in server components.
 */
export function OutboundClickBeacon({ eventId, hrefs }: { eventId: string; hrefs: string[] }) {
  useEffect(() => {
    const targets = hrefs.filter(Boolean).map((h) => h.replace(/\/$/, ""));
    if (targets.length === 0) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.href.replace(/\/$/, "");
      if (!targets.some((t) => href === t || href.startsWith(`${t}?`))) return;
      const anonId = getAnonId();
      if (!anonId) return;
      const body = JSON.stringify({ event_id: eventId, kind: "ticket_click", anon_id: anonId });
      try {
        navigator.sendBeacon("/api/events/signal", new Blob([body], { type: "application/json" }));
      } catch {}
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [eventId, hrefs]);
  return null;
}
