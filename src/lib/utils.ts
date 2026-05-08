import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  isToday,
  isTomorrow,
  isThisWeek,
  addWeeks,
  startOfWeek,
  endOfWeek,
  isAfter,
  isBefore,
} from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function calculateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / 200)
  return Math.max(1, minutes)
}

export function isRecentlyAddedEvent(createdAt: string, startDate: string): boolean {
  const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000
  const created = new Date(createdAt).getTime()
  if (created < fortyEightHoursAgo) return false
  return new Date(startDate).getTime() >= Date.now()
}

export function formatEventDate(startDate: string, endDate?: string | null): string {
  const start = new Date(startDate)
  if (!endDate || isSameDay(start, new Date(endDate))) {
    return format(start, "EEEE, MMMM d, yyyy")
  }
  const end = new Date(endDate)
  if (isSameMonth(start, end)) {
    return `${format(start, "MMMM d")} – ${format(end, "d, yyyy")}`
  }
  if (isSameYear(start, end)) {
    return `${format(start, "MMMM d")} – ${format(end, "MMMM d, yyyy")}`
  }
  return `${format(start, "MMMM d, yyyy")} – ${format(end, "MMMM d, yyyy")}`
}

export function formatEventTime(startTime?: string | null, endTime?: string | null): string {
  if (!startTime) return ""
  const formatTime = (t: string) => {
    const [h, m] = t.split(":")
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const h12 = hour % 12 || 12
    return m === "00" ? `${h12} ${ampm}` : `${h12}:${m} ${ampm}`
  }
  if (!endTime) return formatTime(startTime)
  return `${formatTime(startTime)} – ${formatTime(endTime)}`
}

type TimeBucket =
  | "Today"
  | "Tomorrow"
  | "This Week"
  | "Next Week"
  | "Later";

export function groupEventsByTimeBucket<
  T extends {
    start_date: string
    start_time?: string | null
    is_recurring: boolean
    recurrence_rule: string | null
  },
>(events: T[]): { bucket: TimeBucket; events: T[] }[] {
  const now = new Date()
  const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 })
  const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 })

  const bucketOrder: TimeBucket[] = [
    "Today",
    "Tomorrow",
    "This Week",
    "Next Week",
    "Later",
  ]
  const bucketMap = new Map<TimeBucket, T[]>(
    bucketOrder.map((b) => [b, []])
  )

  for (const event of events) {
    const eventDate = new Date(event.start_date)

    let bucket: TimeBucket
    if (isToday(eventDate)) {
      bucket = "Today"
    } else if (isTomorrow(eventDate)) {
      bucket = "Tomorrow"
    } else if (isThisWeek(eventDate, { weekStartsOn: 1 })) {
      bucket = "This Week"
    } else if (
      !isBefore(eventDate, nextWeekStart) &&
      !isAfter(eventDate, nextWeekEnd)
    ) {
      bucket = "Next Week"
    } else {
      bucket = "Later"
    }

    bucketMap.get(bucket)!.push(event)
  }

  for (const list of bucketMap.values()) {
    list.sort((a, b) => {
      if (a.start_date !== b.start_date) {
        return a.start_date.localeCompare(b.start_date)
      }
      const at = timeToMinutes(a.start_time)
      const bt = timeToMinutes(b.start_time)
      return at - bt
    })
  }

  return bucketOrder
    .filter((b) => bucketMap.get(b)!.length > 0)
    .map((b) => ({ bucket: b, events: bucketMap.get(b)! }))
}

function timeToMinutes(t?: string | null): number {
  if (!t) return Number.MAX_SAFE_INTEGER
  const [h, m] = t.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return Number.MAX_SAFE_INTEGER
  return h * 60 + m
}
