import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeaturedEvents } from "@/components/homepage/featured-events";
import { EventCardSkeleton } from "@/components/skeletons/event-card-skeleton";
import { SpecialCard } from "@/components/specials/special-card";
import { nowInBali } from "@/lib/events/bali-time";
import { runsOn, specialsForToday, WEEKDAY_NAMES } from "@/lib/specials";
import { getLiveSpecials } from "@/lib/specials/queries";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Tonight in Ubud — today's food & drink specials and gatherings",
  description:
    "Today's restaurant specials, happy hours and gatherings in Ubud, in one place. Free, and checked every month.",
  alternates: { canonical: `${SITE_URL}/tonight` },
};

function formatToday(dateStr: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${dateStr}T00:00:00Z`));
}

export default async function TonightPage() {
  const now = nowInBali();
  const specials = await getLiveSpecials();
  const today = specialsForToday(specials, now);

  // The rest of the week, starting tomorrow, so "Tuesday" is always the next one.
  const week = Array.from({ length: 6 }, (_, i) => (now.dayOfWeek + 1 + i) % 7).map((day) => ({
    day,
    items: specials.filter((s) => s.weekdays.length > 0 && runsOn(s, day)),
  }));
  const everyDay = specials.filter((s) => s.weekdays.length === 0);

  return (
    <div>
      <section className="bg-brand-deep-green px-4 py-14 text-center sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
            {formatToday(now.dateStr)}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-brand-off-white sm:text-5xl">
            Tonight in Ubud
          </h1>
          <p className="mt-4 text-lg text-brand-off-white/80">
            Today&apos;s food and drink specials and gatherings, in one place.
            Free. Tell them The Ubudian sent you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="font-serif text-2xl text-brand-deep-green dark:text-brand-gold sm:text-3xl">
          Specials today
        </h2>
        {today.length > 0 ? (
          <div className="mt-6 space-y-4">
            {today.map((s) => (
              <SpecialCard key={s.id} special={s} showDays={false} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-brand-gold/30 p-6 text-muted-foreground">
            No specials listed for the rest of today yet.{" "}
            <Link href="/tonight/add" className="font-medium text-brand-deep-green underline underline-offset-4 dark:text-brand-gold">
              Run a restaurant? Add yours free.
            </Link>
          </p>
        )}
      </section>

      <section className="bg-brand-warm-cream px-4 py-12 dark:bg-transparent">
        <div className="mx-auto max-w-3xl sm:px-2">
          <h2 className="font-serif text-2xl text-brand-deep-green dark:text-brand-gold sm:text-3xl">
            Gatherings
          </h2>
          <Suspense
            fallback={
              <div className="mt-8 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <EventCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <FeaturedEvents />
          </Suspense>
          <div className="mt-6 text-center">
            <Link href="/events" className="text-sm font-medium text-brand-deep-green underline underline-offset-4 dark:text-brand-gold">
              All events this week &rarr;
            </Link>
          </div>
        </div>
      </section>

      {specials.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h2 className="font-serif text-2xl text-brand-deep-green dark:text-brand-gold sm:text-3xl">
            The rest of the week
          </h2>
          {week
            .filter((d) => d.items.length > 0)
            .map((d) => (
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
          {everyDay.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Every day
              </h3>
              <div className="mt-3 space-y-4">
                {everyDay.map((s) => (
                  <SpecialCard key={s.id} special={s} showDays={false} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="bg-brand-pale-green px-4 py-14 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="font-serif text-2xl text-brand-deep-green sm:text-3xl">Run a restaurant or bar in Ubud?</h2>
          <p className="mt-3 text-brand-charcoal-light">
            List your weekly special for free. It shows here on the days it runs,
            and we check it with you once a month so nothing goes stale.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/tonight/add">Add your special</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
