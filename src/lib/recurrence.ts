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
  try {
    return JSON.parse(rule) as RecurrenceRule;
  } catch {
    return null;
  }
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
