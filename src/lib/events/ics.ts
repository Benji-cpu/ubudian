/**
 * ICS calendar generator (RFC 5545).
 *
 * Pure function that takes a list of events and produces a valid VCALENDAR
 * string with one VEVENT per event. Used by the per-user /api/events/ics
 * feed so subscribers can subscribe in Apple Calendar / Google Calendar /
 * Outlook.
 */

import type { Event } from "@/types";

export interface BuildICSOptions {
  calendarName: string;
  calendarUrl: string;
}

const CRLF = "\r\n";
const MAX_LINE_OCTETS = 75;

/**
 * Escapes a text value per RFC 5545 §3.3.11:
 *  - backslash, semicolon, comma must be escaped
 *  - newlines become literal "\n"
 */
function escapeText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/**
 * Folds a single content line so that no line exceeds 75 octets, inserting
 * CRLF + single space per RFC 5545 §3.1.
 *
 * We fold on UTF-8 octet boundaries (encodeURIComponent's %XX trick keeps
 * things portable without needing Buffer).
 */
function foldLine(line: string): string {
  // Short-circuit when possible
  if (getByteLength(line) <= MAX_LINE_OCTETS) return line;

  const out: string[] = [];
  let current = "";
  let currentBytes = 0;
  let isContinuation = false;

  for (const char of line) {
    const charBytes = getByteLength(char);
    // Continuation lines begin with a leading space (1 octet) — account for it
    const limit = isContinuation ? MAX_LINE_OCTETS - 1 : MAX_LINE_OCTETS;
    if (currentBytes + charBytes > limit) {
      out.push(current);
      current = char;
      currentBytes = charBytes;
      isContinuation = true;
    } else {
      current += char;
      currentBytes += charBytes;
    }
  }
  if (current.length > 0) out.push(current);

  return out.join(CRLF + " ");
}

function getByteLength(str: string): number {
  // UTF-8 byte length. TextEncoder is available in Node 18+.
  return new TextEncoder().encode(str).length;
}

/**
 * Formats a Date into ICS UTC datetime: YYYYMMDDTHHMMSSZ
 */
function formatUtcDateTime(date: Date): string {
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hour = date.getUTCHours().toString().padStart(2, "0");
  const minute = date.getUTCMinutes().toString().padStart(2, "0");
  const second = date.getUTCSeconds().toString().padStart(2, "0");
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

/**
 * Formats a date-only value (YYYY-MM-DD) into ICS VALUE=DATE: YYYYMMDD
 */
function formatDateOnly(isoDate: string): string {
  // isoDate = "2026-04-25"
  return isoDate.replace(/-/g, "");
}

/**
 * Adds one day to a YYYY-MM-DD date string for the DTEND of an all-day event.
 * Per RFC 5545, DTEND for all-day events is exclusive.
 */
function addOneDay(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map((n) => parseInt(n, 10));
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + 1);
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Combines an ISO date (YYYY-MM-DD) + time (HH:MM or HH:MM:SS) into a Date.
 * Ubud (WITA) is UTC+8. We treat the DB values as local Bali time and
 * convert to UTC for ICS.
 */
function combineDateTime(isoDate: string, time: string): Date {
  // Normalize time to HH:MM:SS
  const [h = "00", m = "00", s = "00"] = time.split(":");
  const iso = `${isoDate}T${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}+08:00`;
  return new Date(iso);
}

/**
 * Builds a short description from long text when no short_description is set.
 * Trims to ~300 chars at a word boundary.
 */
function truncate(text: string, max = 300): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > 100 ? cut.slice(0, lastSpace) : cut;
  return base.trimEnd() + "…";
}

function buildLocation(event: Event): string | null {
  const parts: string[] = [];
  if (event.venue_name) parts.push(event.venue_name);
  if (event.venue_address) parts.push(event.venue_address);
  if (parts.length === 0) return null;
  return parts.join(", ");
}

function buildVEvent(event: Event, options: BuildICSOptions): string[] {
  const lines: string[] = ["BEGIN:VEVENT"];

  const uid = `${event.id}@ubudian-v1.vercel.app`;
  lines.push(`UID:${uid}`);

  // DTSTAMP is required — use now in UTC
  lines.push(`DTSTAMP:${formatUtcDateTime(new Date())}`);

  // DTSTART / DTEND
  if (event.start_time) {
    const startDate = combineDateTime(event.start_date, event.start_time);
    lines.push(`DTSTART:${formatUtcDateTime(startDate)}`);

    const endDateStr = event.end_date ?? event.start_date;
    const endTimeStr = event.end_time ?? event.start_time;
    const endDate = combineDateTime(endDateStr, endTimeStr);
    // If end is not after start (e.g. missing end_time), add 1 hour
    const finalEnd =
      endDate.getTime() > startDate.getTime()
        ? endDate
        : new Date(startDate.getTime() + 60 * 60 * 1000);
    lines.push(`DTEND:${formatUtcDateTime(finalEnd)}`);
  } else {
    // All-day event
    lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(event.start_date)}`);
    const endIso = event.end_date ?? event.start_date;
    // DTEND for all-day is exclusive — add one day
    lines.push(`DTEND;VALUE=DATE:${addOneDay(endIso)}`);
  }

  lines.push(`SUMMARY:${escapeText(event.title)}`);

  const descSource =
    event.short_description ?? (event.description ? truncate(event.description) : null);
  if (descSource) {
    lines.push(`DESCRIPTION:${escapeText(descSource)}`);
  }

  const location = buildLocation(event);
  if (location) {
    lines.push(`LOCATION:${escapeText(location)}`);
  }

  const url = `${options.calendarUrl.replace(/\/$/, "")}/events/${event.slug}`;
  lines.push(`URL:${escapeText(url)}`);

  lines.push("END:VEVENT");
  return lines;
}

/**
 * Builds a complete RFC 5545 VCALENDAR string. Returns with CRLF line
 * endings. Each content line is folded at 75 octets.
 */
export function buildICS(events: Event[], options: BuildICSOptions): string {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Ubudian//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(options.calendarName)}`,
    `X-WR-CALDESC:${escapeText(`Saved events from ${options.calendarName}`)}`,
    "X-WR-TIMEZONE:Asia/Makassar",
  ];

  const body: string[] = [];
  for (const event of events) {
    body.push(...buildVEvent(event, options));
  }

  const footer = ["END:VCALENDAR"];

  const all = [...header, ...body, ...footer].map(foldLine);
  return all.join(CRLF) + CRLF;
}
