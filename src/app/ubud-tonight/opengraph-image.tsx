import { nowInBali } from "@/lib/events/bali-time";
import { longDate } from "@/lib/events/timetable";
import { renderTimetableOg, timetableOgSize } from "@/lib/og/timetable-card";

export const alt = "Things to do in Ubud tonight, on The Ubudian";
export const size = timetableOgSize;
export const contentType = "image/png";
// The card carries today's date, so build it per request rather than once at deploy.
export const dynamic = "force-dynamic";

export default async function UbudTonightOgImage() {
  return renderTimetableOg({
    eyebrow: "Ubud tonight",
    headline: "Things to do in Ubud tonight",
    dates: longDate(nowInBali().dateStr),
    line: "Times, venues, prices and tickets",
    footer: "theubudian.life/ubud-tonight",
  });
}
