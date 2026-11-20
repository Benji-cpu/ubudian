import { baliWeek, dateSpan } from "@/lib/events/timetable";
import { renderTimetableOg, timetableOgSize } from "@/lib/og/timetable-card";

export const alt = "Ubud events this week, on The Ubudian";
export const size = timetableOgSize;
export const contentType = "image/png";
// The share card shows the week; an hour-old copy is fine (19 Nov 2026).
export const revalidate = 3600;

export default async function UbudThisWeekOgImage() {
  const { monday, sunday } = baliWeek();
  return renderTimetableOg({
    eyebrow: "This week",
    headline: "Ubud events this week",
    dates: `Monday to Sunday, ${dateSpan(monday, sunday)}`,
    line: "Day by day: times, venues, prices and tickets",
    footer: "theubudian.life/ubud-events-this-week",
  });
}
