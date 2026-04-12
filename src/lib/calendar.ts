import type { Event } from "@/types";

/**
 * Generate an ICS calendar file string for an event.
 * Uses WITA timezone (UTC+8) for Bali events.
 */
export function generateICS(event: Event): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Ubudian//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
  ];

  // UID
  lines.push(`UID:${event.id}@theubudian.com`);

  // Timestamp
  const now = formatICSDate(new Date());
  lines.push(`DTSTAMP:${now}`);

  if (event.start_time) {
    // Timed event — use Asia/Makassar (WITA, UTC+8)
    const startDt = buildDateTimeString(event.start_date, event.start_time);
    lines.push(`DTSTART;TZID=Asia/Makassar:${startDt}`);

    if (event.end_time && event.end_date) {
      const endDt = buildDateTimeString(event.end_date, event.end_time);
      lines.push(`DTEND;TZID=Asia/Makassar:${endDt}`);
    } else if (event.end_time) {
      const endDt = buildDateTimeString(event.start_date, event.end_time);
      lines.push(`DTEND;TZID=Asia/Makassar:${endDt}`);
    }
  } else {
    // All-day event — use VALUE=DATE format
    const startDateClean = event.start_date.replace(/-/g, "");
    lines.push(`DTSTART;VALUE=DATE:${startDateClean}`);

    if (event.end_date) {
      // ICS all-day DTEND is exclusive, so add one day
      const endDate = new Date(event.end_date);
      endDate.setDate(endDate.getDate() + 1);
      const endDateClean = formatDateOnly(endDate);
      lines.push(`DTEND;VALUE=DATE:${endDateClean}`);
    }
  }

  // Summary (title)
  lines.push(`SUMMARY:${escapeICSText(event.title)}`);

  // Description
  if (event.short_description || event.description) {
    const desc = event.short_description || event.description?.slice(0, 500) || "";
    lines.push(`DESCRIPTION:${escapeICSText(desc)}`);
  }

  // Location
  const locationParts: string[] = [];
  if (event.venue_name) locationParts.push(event.venue_name);
  if (event.venue_address) locationParts.push(event.venue_address);
  if (locationParts.length > 0) {
    lines.push(`LOCATION:${escapeICSText(locationParts.join(", "))}`);
  }

  // URL
  if (event.external_ticket_url) {
    lines.push(`URL:${event.external_ticket_url}`);
  }

  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/** Format a JS Date as ICS UTC timestamp: 20260411T120000Z */
function formatICSDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const h = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const s = pad(date.getUTCSeconds());
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

/** Format a Date as ICS date-only: 20260411 */
function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}${m}${d}`;
}

/** Build a local datetime string: 20260411T140000 */
function buildDateTimeString(dateStr: string, timeStr: string): string {
  const datePart = dateStr.replace(/-/g, "");
  // timeStr is "HH:MM" or "HH:MM:SS"
  const timeParts = timeStr.split(":");
  const h = pad(parseInt(timeParts[0], 10));
  const m = pad(parseInt(timeParts[1], 10));
  const s = timeParts[2] ? pad(parseInt(timeParts[2], 10)) : "00";
  return `${datePart}T${h}${m}${s}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Escape special characters for ICS text fields */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
