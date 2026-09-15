import {
  addDays,
  addWeeks,
  addMonths,
  isBefore,
  startOfDay,
} from "date-fns";

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
  /**
   * Last date (YYYY-MM-DD, inclusive) the series runs. This is the ONE place a
   * series end lives. It used to be smuggled in as free text ("until
   * 2026-06-09"), as an RRULE `UNTIL=`, or — for 174 todo.today rows — as the
   * event's `end_date`, which the feed then read as a 160-day multi-day event
   * in progress. Migration `20260915090000_recurrence_until.sql` folded all
   * three into this field; `normalizeRecurrenceRule` keeps new rows honest.
   */
  until?: string;
  /**
   * 0=Sun, 1=Mon, ..., 6=Sat. A single number is a single weekday; an
   * array represents multi-day weeklies (e.g. Mon/Wed/Fri = [1,3,5]).
   * Arrays are only meaningful for `weekly` frequency.
   */
  day_of_week?: number | number[];
  day_of_month?: number;
}

/** Normalise day_of_week into an array of unique weekdays for iteration. */
export function daysOfWeekArray(rule: RecurrenceRule): number[] {
  if (rule.day_of_week === undefined) return [];
  if (Array.isArray(rule.day_of_week)) {
    return Array.from(new Set(rule.day_of_week)).sort((a, b) => a - b);
  }
  return [rule.day_of_week];
}

export function parseRecurrenceRule(rule: string | null): RecurrenceRule | null {
  if (!rule) return null;
  const trimmed = rule.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<RecurrenceRule>;
      if (!parsed || typeof parsed !== "object" || !parsed.frequency) return null;
      if (!["daily", "weekly", "biweekly", "monthly"].includes(parsed.frequency)) return null;
      return parsed as RecurrenceRule;
    } catch {
      return null;
    }
  }

  // Tolerate RRULE strings and a few natural-language patterns so that any
  // row that slips past the normalisation migration still rolls forward
  // instead of silently sticking on its seed date.
  return parseRruleString(trimmed) ?? parseNaturalLanguage(trimmed);
}

const DAY_INDEX_BY_RRULE: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

function parseRruleString(s: string): RecurrenceRule | null {
  const body = s.replace(/^RRULE:/i, "");
  if (!/FREQ=/i.test(body)) return null;
  const parts: Record<string, string> = {};
  for (const kv of body.split(";")) {
    const [k, v] = kv.split("=");
    if (k) parts[k.toUpperCase()] = v ?? "";
  }
  const freq = parts.FREQ?.toUpperCase();
  let frequency: RecurrenceRule["frequency"];
  if (freq === "DAILY") frequency = "daily";
  else if (freq === "WEEKLY") frequency = parts.INTERVAL === "2" ? "biweekly" : "weekly";
  else if (freq === "MONTHLY") frequency = "monthly";
  else return null;
  const rule: RecurrenceRule = { frequency };
  const until = parts.UNTIL?.match(/^(\d{4})(\d{2})(\d{2})/);
  if (until) rule.until = `${until[1]}-${until[2]}-${until[3]}`;
  const byday = parts.BYDAY?.toUpperCase();
  if (!byday) return rule;
  const days = byday
    .split(",")
    .map((d) => DAY_INDEX_BY_RRULE[d.trim()])
    .filter((d): d is number => typeof d === "number");
  if (days.length === 0) return rule;
  rule.day_of_week = days.length === 1 ? days[0] : days;
  return rule;
}

const DAY_NAMES = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
] as const;

function parseNaturalLanguage(s: string): RecurrenceRule | null {
  const lower = s.toLowerCase();
  const untilMatch = lower.match(/until\s+(\d{4}-\d{2}-\d{2})/);
  const until = untilMatch ? untilMatch[1] : undefined;
  const withUntil = (rule: RecurrenceRule): RecurrenceRule => (until ? { ...rule, until } : rule);

  const biweekly =
    lower.startsWith("alternat") ||
    lower.includes("biweek") ||
    lower.includes("bi-week") ||
    lower.includes("every other") ||
    lower.includes("every second") ||
    lower.includes("every 2 weeks") ||
    lower.includes("every two weeks");

  const hits: number[] = [];
  for (let i = 0; i < DAY_NAMES.length; i++) {
    if (lower.includes(DAY_NAMES[i])) hits.push(i);
  }
  if (hits.length > 0) {
    const frequency: RecurrenceRule["frequency"] = biweekly ? "biweekly" : "weekly";
    if (hits.length === 1) return withUntil({ frequency, day_of_week: hits[0] });
    return withUntil({ frequency, day_of_week: hits });
  }
  if (biweekly) return withUntil({ frequency: "biweekly" });
  if (lower.startsWith("monthly") || lower.startsWith("every month")) return withUntil({ frequency: "monthly" });
  if (lower.startsWith("daily") || lower.startsWith("every day")) return withUntil({ frequency: "daily" });
  if (lower.startsWith("weekly") || lower.startsWith("every week")) return withUntil({ frequency: "weekly" });
  // "until 2026-06-09" on its own carries an end but no cadence. It only ever
  // appeared on weekly rows, so read it as weekly-from-seed.
  if (until && lower.trim().startsWith("until")) return { frequency: "weekly", until };
  return null;
}

/** ISO date the series ends on, or null when it runs open-ended. */
export function recurrenceEndDate(rule: string | null): string | null {
  const parsed = parseRecurrenceRule(rule);
  return parsed?.until ?? null;
}

/**
 * Canonical JSON form of a rule, or null when the input does not describe a
 * recurrence at all. `seriesEnd` is folded in as `until` when the rule has none —
 * this is how a harvester's "until 11 Nov" (which used to land in `end_date`)
 * becomes part of the rule. Every write path that can carry a rule runs its
 * value through here so the database only ever holds one format.
 */
export function normalizeRecurrenceRule(
  rule: string | null | undefined,
  seriesEnd?: string | null,
): string | null {
  const parsed = parseRecurrenceRule(rule ?? null);
  if (!parsed) return null;
  const out: RecurrenceRule = { frequency: parsed.frequency };
  if (parsed.day_of_week !== undefined) {
    const days = daysOfWeekArray(parsed).filter((d) => d >= 0 && d <= 6);
    if (days.length === 1) out.day_of_week = days[0];
    else if (days.length > 1) out.day_of_week = days;
  }
  if (parsed.day_of_month) out.day_of_month = parsed.day_of_month;
  const until = parsed.until ?? (seriesEnd && /^\d{4}-\d{2}-\d{2}$/.test(seriesEnd) ? seriesEnd : undefined);
  if (until) out.until = until;
  return JSON.stringify(out);
}

export function expandRecurrence(
  event: { start_date: string; recurrence_rule: string | null },
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const rule = parseRecurrenceRule(event.recurrence_rule);
  if (!rule) return [new Date(event.start_date)];

  const seed = startOfDay(new Date(event.start_date));
  const start = startOfDay(rangeStart);
  // A series that has ended emits nothing past its last day. `until` is
  // inclusive; `rangeEnd` is exclusive, so the cap is the day after.
  const untilExclusive = rule.until ? addDays(startOfDay(new Date(rule.until)), 1) : null;
  const end =
    untilExclusive && isBefore(untilExclusive, startOfDay(rangeEnd))
      ? untilExclusive
      : startOfDay(rangeEnd);

  // Weekly with day_of_week (single or multi): walk each candidate day in
  // the range and emit if the weekday matches. Honours the rule even when
  // the seed's weekday disagrees (bad-data tolerance).
  if (rule.frequency === "weekly" && rule.day_of_week !== undefined) {
    const days = daysOfWeekArray(rule);
    const dates: Date[] = [];
    const cursor = seed;
    const safeStart = cursor < start ? start : cursor;
    let probe = startOfDay(safeStart);
    let count = 0;
    while (isBefore(probe, end) && count < 365) {
      if (!isBefore(probe, seed) && days.includes(probe.getDay())) {
        if (!isBefore(probe, start)) dates.push(new Date(probe));
      }
      probe = addDays(probe, 1);
      count++;
    }
    return dates;
  }

  const dates: Date[] = [];
  let current = seed;
  const maxOccurrences = 365;
  let count = 0;

  while (isBefore(current, end) && count < maxOccurrences) {
    if (!isBefore(current, start)) {
      dates.push(new Date(current));
    }

    switch (rule.frequency) {
      case "daily":
        current = addDays(current, 1);
        break;
      case "weekly":
        current = addWeeks(current, 1);
        break;
      case "biweekly":
        current = addWeeks(current, 2);
        break;
      case "monthly":
        current = addMonths(current, 1);
        break;
    }
    count++;
  }

  return dates;
}

export function formatRecurrenceRule(rule: string | null): string {
  const parsed = parseRecurrenceRule(rule);
  if (!parsed) return "";
  const base = formatCadence(parsed);
  if (!parsed.until) return base;
  const [y, m, d] = parsed.until.split("-").map(Number);
  const untilLabel = new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${base} · until ${untilLabel}`;
}

function formatCadence(parsed: RecurrenceRule): string {

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formatDays = (days: number[]) => {
    if (days.length === 1) return dayNames[days[0]];
    if (days.length === 2) return `${dayNamesShort[days[0]]} & ${dayNamesShort[days[1]]}`;
    return days.map((d) => dayNamesShort[d]).join(", ");
  };

  switch (parsed.frequency) {
    case "daily":
      return "Every day";
    case "weekly": {
      const days = daysOfWeekArray(parsed);
      if (days.length === 0) return "Every week";
      return `Every ${formatDays(days)}`;
    }
    case "biweekly": {
      const days = daysOfWeekArray(parsed);
      if (days.length === 0) return "Every 2 weeks";
      return `Every other ${formatDays(days)}`;
    }
    case "monthly":
      return parsed.day_of_month
        ? `Monthly on the ${parsed.day_of_month}${getOrdinalSuffix(parsed.day_of_month)}`
        : "Every month";
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
