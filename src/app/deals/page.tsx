import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SpecialCard } from "@/components/specials/special-card";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { nowInBali } from "@/lib/events/bali-time";
import { daysUnknown, isOnNow, runsOn, specialsForToday, WEEKDAY_NAMES } from "@/lib/specials";
import { getLiveSpecials } from "@/lib/specials/queries";
import { SITE_URL } from "@/lib/constants";

// "On now" and "today" are read off the clock, so never serve a cached copy.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ubud deals — 2-for-1s, happy hours and weekly food nights",
  description:
    "Every food and drink deal we've found in Ubud, by day: 2-for-1 pizza nights, happy hours, set lunches. Each one sourced and checked every month.",
  alternates: { canonical: `${SITE_URL}/deals` },
};

export default async function DealsPage() {
  const now = nowInBali();
  const deals = await getLiveSpecials();
  const today = specialsForToday(deals, now);
  const venues = new Set(deals.map((d) => d.venue_name)).size;

  // The rest of the week, starting tomorrow, so "Tuesday" is always the next one.
  const week = Array.from({ length: 6 }, (_, i) => (now.dayOfWeek + 1 + i) % 7)
    .map((day) => ({ day, items: deals.filter((d) => d.weekdays.length > 0 && runsOn(d, day)) }))
    .filter((d) => d.items.length > 0);
  const everyDay = deals.filter((d) => d.weekdays.length === 0 && !daysUnknown(d));
  const askDays = deals.filter((d) => daysUnknown(d));

  return (
    <div>
      <section className="bg-brand-deep-green px-4 py-14 text-center sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
            {deals.length} deals at {venues} places
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-brand-off-white sm:text-5xl">
            Ubud deals
          </h1>
          <p className="mt-4 text-lg text-brand-off-white/80">
            2-for-1s, happy hours and weekly food nights, each one taken from the venue&apos;s own
            page or a dated guide and checked every month. Tell them The Ubudian sent you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="font-serif text-2xl text-brand-deep-green dark:text-brand-gold sm:text-3xl">
          Today, {WEEKDAY_NAMES[now.dayOfWeek]}
        </h2>
        {today.length > 0 ? (
          <div className="mt-6 space-y-4">
            {today.map((d) => (
              <SpecialCard key={d.id} special={d} showDays={false} onNow={isOnNow(d, now)} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-brand-gold/30 p-6 text-muted-foreground">
            Nothing left running today. Tomorrow&apos;s deals are below.
          </p>
        )}
      </section>

      {week.length > 0 && (
        <section className="bg-brand-warm-cream px-4 py-12 dark:bg-transparent">
          <div className="mx-auto max-w-3xl sm:px-2">
            <h2 className="font-serif text-2xl text-brand-deep-green dark:text-brand-gold sm:text-3xl">
              The rest of the week
            </h2>
            {week.map((d) => (
              <div key={d.day} className="mt-8">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {WEEKDAY_NAMES[d.day]}
                </h3>
                <div className="mt-3 space-y-4">
                  {d.items.map((s) => (
                    <SpecialCard key={s.id} special={s} showDays={false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {everyDay.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h2 className="font-serif text-2xl text-brand-deep-green dark:text-brand-gold sm:text-3xl">
            Every day
          </h2>
          <div className="mt-6 space-y-4">
            {everyDay.map((s) => (
              <SpecialCard key={s.id} special={s} showDays={false} />
            ))}
          </div>
        </section>
      )}

      {askDays.length > 0 && (
        <section className="bg-brand-warm-cream px-4 py-12 dark:bg-transparent">
          <div className="mx-auto max-w-3xl sm:px-2">
            <h2 className="font-serif text-2xl text-brand-deep-green dark:text-brand-gold sm:text-3xl">
              Ask which days
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Real deals whose source gives the hours but not the days. Check before you go.
            </p>
            <div className="mt-6 space-y-4">
              {askDays.map((s) => (
                <SpecialCard key={s.id} special={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-brand-gold/20 px-4 py-12 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="font-serif text-2xl text-brand-deep-green dark:text-brand-gold">
            Get the week&apos;s best deals every Wednesday
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">One short email. Unsubscribe any time.</p>
          <NewsletterSignup source="deals" className="mx-auto mt-6 max-w-md" />
        </div>
      </section>

      <section className="bg-brand-pale-green px-4 py-14 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="font-serif text-2xl text-brand-deep-green sm:text-3xl">Run a restaurant or bar in Ubud?</h2>
          <p className="mt-3 text-brand-charcoal-light">
            List your deal for free. It shows here on the days it runs, and we check it with you
            once a month so nothing goes stale.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/tonight/add">Add your deal</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
