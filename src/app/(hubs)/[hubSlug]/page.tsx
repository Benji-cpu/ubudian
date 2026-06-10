import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { HUBS, getHub } from "@/lib/hubs";
import { HubJsonLd } from "@/components/hubs/hub-json-ld";
import { EventGridCard } from "@/components/events/event-grid-card";
import { stripEmbeddings } from "@/lib/events/strip-embedding";
import { formatRecurrenceRule, parseRecurrenceRule, daysOfWeekArray } from "@/lib/recurrence";
import { formatEventTime } from "@/lib/utils";
import { nowInBali } from "@/lib/events/bali-time";
import { SITE_URL } from "@/lib/constants";
import type { Event } from "@/types";

// ISR: regenerate at most hourly — fresh enough for an agenda, static for SEO.
export const revalidate = 3600;
// Closed set of hubs — unknown slugs hard-404 at the routing layer instead of
// streaming a soft-404 (200 + not-found UI), which Google would index.
export const dynamicParams = false;

export function generateStaticParams() {
  return HUBS.map((h) => ({ hubSlug: h.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hubSlug: string }>;
}): Promise<Metadata> {
  const { hubSlug } = await params;
  const hub = getHub(hubSlug);
  if (!hub) return {};
  return {
    title: hub.title,
    description: hub.metaDescription,
    alternates: { canonical: `${SITE_URL}/${hub.slug}` },
    openGraph: {
      title: `${hub.title} | The Ubudian`,
      description: hub.metaDescription,
      url: `${SITE_URL}/${hub.slug}`,
    },
  };
}

export default async function HubPage({
  params,
}: {
  params: Promise<{ hubSlug: string }>;
}) {
  const { hubSlug } = await params;
  const hub = getHub(hubSlug);
  if (!hub) notFound();

  const today = nowInBali().dateStr;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("status", "approved")
    .overlaps("vibe_tags", hub.vibeTags)
    .or(`start_date.gte.${today},is_recurring.eq.true`)
    .order("start_date", { ascending: true })
    .limit(80);

  const events = stripEmbeddings((data ?? []) as Event[]);

  const weekly = events
    .filter((e) => e.is_recurring && e.recurrence_rule)
    .sort((a, b) => firstWeekday(a) - firstWeekday(b));
  const oneOffs = events.filter(
    (e) => !(e.is_recurring && e.recurrence_rule) && e.start_date >= today
  );

  const siblings = HUBS.filter((h) => h.slug !== hub.slug);

  return (
    <div className="min-h-screen bg-background">
      <HubJsonLd hub={hub} events={[...oneOffs, ...weekly]} />

      {/* Locked-dark editorial band — literal hex per brand-var inversion rule */}
      <section className="border-b border-brand-gold/15 bg-[#2C4A3E] py-10 dark:bg-[#0D1A14] sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold">
            The Ubudian field guide
          </p>
          <h1 className="mt-3 font-serif text-3xl font-normal tracking-wide text-brand-gold sm:text-5xl">
            {hub.title}
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          {hub.intro.map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {p}
            </p>
          ))}
        </div>

        {weekly.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-medium text-brand-deep-green dark:text-brand-gold">
              The weekly rhythm
            </h2>
            <div className="mt-5 overflow-hidden rounded-xl border border-border">
              {weekly.map((e, i) => (
                <Link
                  key={e.id}
                  href={`/events/${e.slug}`}
                  className={`flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-4 ${
                    i > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <span className="w-44 shrink-0 text-sm font-semibold text-brand-deep-green dark:text-brand-gold">
                    {formatRecurrenceRule(e.recurrence_rule)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-serif text-base text-foreground">
                    {e.title}
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {[formatEventTime(e.start_time, e.end_time), e.venue_name]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {oneOffs.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-medium text-brand-deep-green dark:text-brand-gold">
              Coming up
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {oneOffs.slice(0, 18).map((e) => (
                <EventGridCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}

        {weekly.length === 0 && oneOffs.length === 0 && (
          <p className="mt-12 text-muted-foreground">
            Nothing on the calendar right now — new gatherings land daily.{" "}
            <Link href="/events" className="font-medium text-brand-deep-green underline underline-offset-4 dark:text-brand-gold">
              Browse the full agenda
            </Link>
            .
          </p>
        )}

        <section className="mt-14 border-t border-border pt-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Go deeper
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {siblings.map((h) => (
              <Link
                key={h.slug}
                href={`/${h.slug}`}
                className="rounded-full border border-brand-gold/30 px-4 py-1.5 text-sm text-foreground transition-colors hover:border-brand-gold hover:bg-brand-gold/10"
              >
                {h.title}
              </Link>
            ))}
            <Link
              href="/events"
              className="rounded-full border border-brand-gold/30 px-4 py-1.5 text-sm text-foreground transition-colors hover:border-brand-gold hover:bg-brand-gold/10"
            >
              Full agenda →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function firstWeekday(e: Event): number {
  const rule = parseRecurrenceRule(e.recurrence_rule);
  if (!rule) return 7;
  const days = daysOfWeekArray(rule);
  return days.length > 0 ? days[0] : 7;
}
