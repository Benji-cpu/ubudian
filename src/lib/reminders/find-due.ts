import { addDays } from "date-fns";
import { expandRecurrence } from "@/lib/recurrence";

/**
 * Pure occurrence-matching for saved-event reminders, extracted so it's
 * testable without mocking Supabase. The cron route fetches saves + events
 * and asks: does this event happen on the target Bali date?
 */

export interface ReminderEvent {
  id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
}

function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * True when `event` has an occurrence exactly on `targetYmd` (Bali-local
 * YYYY-MM-DD). Non-recurring events match on their start_date only — no
 * mid-festival reminders. Recurring events expand via the same
 * `expandRecurrence` the /events feed uses, with one addition: a natural-
 * language "until YYYY-MM-DD" in the rule string caps the series
 * (expandRecurrence itself has no until-cap).
 */
export function eventOccursOn(event: ReminderEvent, targetYmd: string): boolean {
  if (event.status !== "approved") return false;

  if (!event.is_recurring || !event.recurrence_rule) {
    return event.start_date === targetYmd;
  }

  const until = /until\s+(\d{4}-\d{2}-\d{2})/i.exec(event.recurrence_rule)?.[1];
  if (until && targetYmd > until) return false;
  if (targetYmd < event.start_date) return false;

  const rangeStart = parseYmdLocal(targetYmd);
  const hits = expandRecurrence(
    { start_date: event.start_date, recurrence_rule: event.recurrence_rule },
    rangeStart,
    addDays(rangeStart, 1)
  );
  return hits.some((h) => formatYmdLocal(h) === targetYmd);
}

export interface SaveRow {
  profileId: string;
  email: string | null;
  emailOptOut: boolean;
  event: ReminderEvent;
}

export interface DueReminder {
  profileId: string;
  email: string;
  eventId: string;
  occurrenceDate: string;
  dedupeKey: string;
}

export function findDueReminders(saves: SaveRow[], targetYmd: string): DueReminder[] {
  const due: DueReminder[] = [];
  for (const save of saves) {
    if (!save.email || save.emailOptOut) continue;
    if (!eventOccursOn(save.event, targetYmd)) continue;
    due.push({
      profileId: save.profileId,
      email: save.email,
      eventId: save.event.id,
      occurrenceDate: targetYmd,
      dedupeKey: `reminder:${save.profileId}:${save.event.id}:${targetYmd}`,
    });
  }
  return due;
}
