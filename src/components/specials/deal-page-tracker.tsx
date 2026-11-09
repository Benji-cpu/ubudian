"use client";

import { useEffect } from "react";
import {
  countingOff,
  DEAL_TAP_KINDS,
  DEAL_TRACK_ATTR,
  DEAL_TRACK_PATH,
  type DealEventKind,
} from "@/lib/specials/deal-track";

type Payload = { slug: string; kind: DealEventKind; specialId?: string };

/** Fire and forget: a beacon survives the reader leaving for Maps or Instagram; fetch keepalive where there's none. */
function send(payload: Payload) {
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(DEAL_TRACK_PATH, new Blob([body], { type: "application/json" }))) {
      return;
    }
  } catch {
    // Fall through to fetch.
  }
  try {
    fetch(DEAL_TRACK_PATH, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    // Counting must never break the page.
  }
}

/**
 * The deal page counter (`deal_page_events`): one view per venue per browser
 * session, and a tap on any element marked `data-deal-track="<kind>"`. Listens
 * at the document so the links stay plain anchors in the server component. No
 * cookies, no third parties; nothing at all when `localStorage.ubu_nocount` is "1".
 */
export function DealPageTracker({ slug, specialId }: { slug: string; specialId?: string }) {
  useEffect(() => {
    if (countingOff()) return;
    const base = specialId ? { slug, specialId } : { slug };

    try {
      const key = `ubu_deal_view:${slug}`;
      if (!window.sessionStorage.getItem(key)) {
        window.sessionStorage.setItem(key, "1");
        send({ ...base, kind: "view" });
      }
    } catch {
      // Storage blocked: skip the view rather than count every reload.
    }

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.(`[${DEAL_TRACK_ATTR}]`);
      const kind = el?.getAttribute(DEAL_TRACK_ATTR) as DealEventKind | null | undefined;
      if (!kind || !(DEAL_TAP_KINDS as string[]).includes(kind) || countingOff()) return;
      send({ ...base, kind });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [slug, specialId]);

  return null;
}
