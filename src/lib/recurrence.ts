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
      return JSON.parse(trimmed) as RecurrenceRule;
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
  else if (freq === "WEEKLY") frequency = "weekly";
  else if (freq === "MONTHLY") frequency = "monthly";
  else return null;
  const byday = parts.BYDAY?.toUpperCase();
  if (!byday) return { frequency };
  const days = byday
    .split(",")
    .map((d) => DAY_INDEX_BY_RRULE[d.trim()])
    .filter((d): d is number => typeof d === "number");
  if (days.length === 0) return { frequency };
  if (days.length === 1) return { frequency, day_of_week: days[0] };
  return { frequency, day_of_week: days };
}

const DAY_NAMES = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
] as const;

function parseNaturalLanguage(s: string): RecurrenceRule | null {
  const lower = s.toLowerCase();
  const hits: number[] = [];
  for (let i = 0; i < DAY_NAMES.length; i++) {
    if (lower.includes(DAY_NAMES[i])) hits.push(i);
  }
  if (hits.length > 0) {
    const biweekly =
      lower.startsWith("alternat") ||
      lower.includes("biweek") ||
      lower.includes("every other");
    const frequency: RecurrenceRule["frequency"] = biweekly ? "biweekly" : "weekly";
    if (hits.length === 1) return { frequency, day_of_week: hits[0] };
    return { frequency, day_of_week: hits };
  }
  if (lower === "monthly" || lower.startsWith("every month")) return { frequency: "monthly" };
  if (lower === "daily" || lower.startsWith("every day")) return { frequency: "daily" };
  return null;
}

export function expandRecurrence(
  event: { start_date: string; recurrence_rule: string | null },
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const rule = parseRecurrenceRule(event.recurrence_rule);
  if (!rule) return [new Date(event.start_date)];

  const seed = startOfDay(new Date(event.start_date));
  const end = startOfDay(rangeEnd);
  const start = startOfDay(rangeStart);

  // Multi-day weekly (e.g. Mon/Wed/Fri): walk each candidate day in
  // the range and emit if the weekday matches.
  if (rule.frequency === "weekly" && Array.isArray(rule.day_of_week)) {
    const days = daysOfWeekArray(rule);
    const dates: Date[] = [];
    let cursor = seed;
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
