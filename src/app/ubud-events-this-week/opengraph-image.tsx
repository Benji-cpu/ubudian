import { baliWeek, dateSpan } from "@/lib/events/timetable";
import { renderTimetableOg, timetableOgSize } from "@/lib/og/timetable-card";

export const alt = "Ubud events this week, on The Ubudian";
export const size = timetableOgSize;
export const contentType = "image/png";
// The card carries this week's dates, so build it per request rather than once at deploy.
export const dynamic = "force-dynamic";

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
