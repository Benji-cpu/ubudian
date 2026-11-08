import type { Metadata } from "next";
import Link from "next/link";
import { OutboundListBeacon } from "@/components/events/outbound-list-beacon";
import { TimetableJsonLd, TimetableLinks, TimetableRow, TimetableSubscribe } from "@/components/events/timetable";
import { nowInBali } from "@/lib/events/bali-time";
import { checkedLine, compareByTime, longDate, stillAheadToday, tonightTitle } from "@/lib/events/timetable";
import { getLastIngestAt, getPublicListings } from "@/lib/events/timetable-queries";
import { SITE_URL } from "@/lib/constants";

// "Still to come" is read off the Bali clock, so never serve a cached copy.
export const dynamic = "force-dynamic";

const DESCRIPTION =
  "What's still on in Ubud today: dance, ceremonies, sound, breathwork and more, with times, venues, prices and tickets. Checked every day.";

export async function generateMetadata(): Promise<Metadata> {
  const title = tonightTitle(nowInBali().dateStr);
  const url = `${SITE_URL}/ubud-tonight`;
  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: { title, description: DESCRIPTION, url, type: "website", siteName: "The Ubudian" },
    twitter: { card: "summary_large_image", title, description: DESCRIPTION },
  };
}

/**
 * /ubud-tonight: what is still to come today in Bali, for the people who
 * search "things to do in Ubud tonight". Not /tonight, which 308s to /deals
 * (venues hold /tonight/add and /tonight/confirm links). Built from the same
 * public, rule-checked listings as /events, with the homepage's 30-minute grace.
 */
export default async function UbudTonightPage() {
  const now = new Date();
  const today = nowInBali(now).dateStr;
  const [listings, lastIngest] = await Promise.all([getPublicListings(), getLastIngestAt()]);
  const tonight = stillAheadToday(listings, now).sort(compareByTime);

  return (
    <div>
      <TimetableJsonLd events={tonight} />
      <OutboundListBeacon />

      {/* Literal hex: the brand-deep-green token turns light sage in dark mode, under light text. */}
      <section className="bg-[#2C4A3E] py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {lastIngest ? <p className="text-sm text-[#FAF5EC]/75">{checkedLine(lastIngest, now)}</p> : null}
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-[#FAF5EC] sm:text-5xl">
            Things to do in Ubud tonight
          </h1>
          <p className="mt-3 font-serif text-xl italic text-brand-gold">{longDate(today)}</p>
          <p className="mt-4 max-w-xl text-[#FAF5EC]/80">
            {tonight.length > 0
              ? `${tonight.length} ${tonight.length === 1 ? "gathering" : "gatherings"} still to come today, with times, venues and how to get in.`
              : "Nothing else is listed for today."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {tonight.length > 0 ? (
          <ul className="divide-y divide-border">
            {tonight.map((e) => (
              <TimetableRow key={e.id} event={e} />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-brand-gold/30 p-6 text-muted-foreground">
            That&apos;s everything listed for today.{" "}
            <Link href="/ubud-events-this-week" className="font-medium text-brand-deep-green underline underline-offset-4 dark:text-brand-gold">
              See the rest of this week
            </Link>
            .
          </p>
        )}

        <div className="mt-8">
          <TimetableSubscribe source="ubud_tonight" />
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Times are Bali time. Prices often change at the door, so check with the organiser before you go.
        </p>

        <div className="mt-10">
          <TimetableLinks current="tonight" />
        </div>
      </div>
    </div>
  );
}
