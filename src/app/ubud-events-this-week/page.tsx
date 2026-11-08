import type { Metadata } from "next";
import { OutboundListBeacon } from "@/components/events/outbound-list-beacon";
import { TimetableJsonLd, TimetableLinks, TimetableRow, TimetableSubscribe } from "@/components/events/timetable";
import { baliWeek, checkedLine, dateSpan, shortDate, thisWeekByDay, weekTitle } from "@/lib/events/timetable";
import { getLastIngestAt, getPublicListings } from "@/lib/events/timetable-queries";
import { SITE_URL } from "@/lib/constants";

// Today's part of the week is read off the Bali clock, so never serve a cached copy.
export const dynamic = "force-dynamic";

const DESCRIPTION =
  "Every gathering in Ubud this week, Monday to Sunday, day by day: dance, ceremonies, sound, breathwork, workshops. Times, venues, prices and tickets, checked every day.";

export async function generateMetadata(): Promise<Metadata> {
  const { monday, sunday } = baliWeek();
  const title = weekTitle(monday, sunday);
  const url = `${SITE_URL}/ubud-events-this-week`;
  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: { title, description: DESCRIPTION, url, type: "website", siteName: "The Ubudian" },
    twitter: { card: "summary_large_image", title, description: DESCRIPTION },
  };
}

/**
 * /ubud-events-this-week: the Bali week, Monday to Sunday, grouped by day
 * from today. Today follows /ubud-tonight; days already over drop off.
 */
export default async function UbudThisWeekPage() {
  const now = new Date();
  const { monday, sunday } = baliWeek(now);
  const [listings, lastIngest] = await Promise.all([getPublicListings(), getLastIngestAt()]);
  const days = thisWeekByDay(listings, now);
  const rows = days.flatMap((d) => d.events);

  return (
    <div>
      <TimetableJsonLd events={rows} />
      <OutboundListBeacon />

      {/* Literal hex: the brand-deep-green token turns light sage in dark mode, under light text. */}
      <section className="bg-[#2C4A3E] py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {lastIngest ? <p className="text-sm text-[#FAF5EC]/75">{checkedLine(lastIngest, now)}</p> : null}
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-[#FAF5EC] sm:text-5xl">Ubud events this week</h1>
          <p className="mt-3 font-serif text-xl italic text-brand-gold">Monday to Sunday, {dateSpan(monday, sunday)}</p>
          <p className="mt-4 max-w-xl text-[#FAF5EC]/80">
            {rows.length > 0
              ? `${rows.length} ${rows.length === 1 ? "gathering" : "gatherings"} from today to Sunday, day by day.`
              : "Nothing else is listed for this week."}
          </p>
          {days.length > 1 ? (
            <nav aria-label="Jump to a day" className="mt-6 flex flex-wrap gap-2">
              {days.map((d) => (
                <a
                  key={d.date}
                  href={`#day-${d.date}`}
                  className="rounded-full border border-[#FAF5EC]/30 px-3 py-1.5 text-sm text-[#FAF5EC] transition-colors hover:border-brand-gold hover:text-brand-gold"
                >
                  {shortDate(d.date).replace(/ \w+$/, "")}
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="space-y-10">
          {days.map((d) => (
            <section key={d.date} id={`day-${d.date}`} className="scroll-mt-20">
              <h2 className="border-b border-brand-gold/30 pb-2 font-serif text-2xl text-brand-deep-green dark:text-brand-gold">
                {d.label}
              </h2>
              {d.events.length > 0 ? (
                <ul className="divide-y divide-border">
                  {d.events.map((e) => (
                    <TimetableRow key={`${e.id}-${e.start_date}`} event={e} />
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-muted-foreground">Nothing listed yet. New gatherings are added every night.</p>
              )}
            </section>
          ))}
        </div>

        <div className="mt-10">
          <TimetableSubscribe source="ubud_this_week" />
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Times are Bali time. Prices often change at the door, so check with the organiser before you go.
        </p>

        <div className="mt-10">
          <TimetableLinks current="week" />
        </div>
      </div>
    </div>
  );
}
