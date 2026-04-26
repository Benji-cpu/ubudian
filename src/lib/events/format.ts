/**
 * Shared date-line formatter for event cards.
 *
 * Single-day events render as their date ("Apr 26"). Multi-day events that
 * either kick off today or are mid-span render with progress framing
 * ("Day 3 of 5", "Starts today · runs through Apr 30") so the card doesn't
 * advertise an old start_date for an event that's actually live now.
 */

import { format } from "date-fns";
import type { Event } from "@/types";
import { nowInBali } from "./bali-time";

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatEventDateLine(
  event: Event,
  now: Date = new Date(),
  style: "short" | "long" = "short"
): string {
  const today = nowInBali(now).dateStr;
  const start = event.start_date;
  const end = event.end_date && event.end_date >= event.start_date ? event.end_date : null;
  const singleFmt = style === "long" ? "EEEE, MMMM d" : "MMM d";

  // Single-day or no end_date — preserve existing behaviour.
  if (!end || end === start) {
    return format(parseYMDLocal(start), singleFmt);
  }

  const totalDays = daysBetween(start, end) + 1;

  // Multi-day, currently in span.
  if (start <= today && end >= today) {
    if (start === today) {
      // Day 1 today: emphasise that it kicks off now.
      return `Starts today · runs through ${format(parseYMDLocal(end), "MMM d")}`;
    }
    const dayNumber = daysBetween(start, today) + 1;
    if (end === today) {
      return `Day ${dayNumber} of ${totalDays} · ends today`;
    }
    return `Day ${dayNumber} of ${totalDays} · ends ${format(parseYMDLocal(end), "MMM d")}`;
  }

  // Multi-day, fully in the future.
  if (start > today) {
    return `${format(parseYMDLocal(start), singleFmt)} – ${format(parseYMDLocal(end), "MMM d")}`;
  }

  // Multi-day, fully in the past — fall back to start date for completeness.
  return format(parseYMDLocal(start), singleFmt);
}

function parseYMDLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / DAY_MS
  );
}
