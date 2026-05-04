import {
  addDays,
  addWeeks,
  addMonths,
  isBefore,
  startOfDay,
} from "date-fns";

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
  day_of_week?: number; // 0=Sun, 1=Mon, ..., 6=Sat
  day_of_month?: number;
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
  const day_of_week = byday ? DAY_INDEX_BY_RRULE[byday] : undefined;
  return day_of_week !== undefined ? { frequency, day_of_week } : { frequency };
}

const DAY_NAMES = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
] as const;

function parseNaturalLanguage(s: string): RecurrenceRule | null {
  const lower = s.toLowerCase();
  for (let i = 0; i < DAY_NAMES.length; i++) {
    if (!lower.includes(DAY_NAMES[i])) continue;
    if (
      lower.startsWith("alternat") ||
      lower.includes("biweek") ||
      lower.includes("every other")
    ) {
      return { frequency: "biweekly", day_of_week: i };
    }
    return { frequency: "weekly", day_of_week: i };
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

  const dates: Date[] = [];
  let current = startOfDay(new Date(event.start_date));
  const end = startOfDay(rangeEnd);
  const maxOccurrences = 365;
  let count = 0;

  while (isBefore(current, end) && count < maxOccurrences) {
    if (!isBefore(current, startOfDay(rangeStart))) {
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

  switch (parsed.frequency) {
    case "daily":
      return "Every day";
    case "weekly":
      return parsed.day_of_week !== undefined
        ? `Every ${dayNames[parsed.day_of_week]}`
        : "Every week";
    case "biweekly":
      return parsed.day_of_week !== undefined
        ? `Every other ${dayNames[parsed.day_of_week]}`
        : "Every 2 weeks";
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
