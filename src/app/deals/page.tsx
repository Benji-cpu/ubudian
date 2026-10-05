import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SpecialCard } from "@/components/specials/special-card";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { ChannelFollow } from "@/components/whatsapp/channel-follow";
import { nowInBali } from "@/lib/events/bali-time";
import { daysUnknown, isOnNow, runsOn, specialsForToday, WEEKDAY_NAMES } from "@/lib/specials";
import { getLiveSpecials } from "@/lib/specials/queries";
import { SITE_URL } from "@/lib/constants";

// "On now" and "today" are read off the clock, so never serve a cached copy.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ubud deals — breakfast sets, 2-for-1 pizza and good food for less",
  description:
    "Food, café and wellness deals in Ubud, by day: breakfast boards, a vegan buffet, 2-for-1 pizza night. No drink deals.",
  alternates: { canonical: `${SITE_URL}/deals` },
};

export default async function DealsPage() {
  const now = nowInBali();
  const deals = await getLiveSpecials();
  const today = specialsForToday(deals, now);

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
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-brand-off-white sm:text-5xl">
            Ubud deals
          </h1>
          <p className="mt-4 text-lg text-brand-off-white/80">
            Breakfast boards, a vegan buffet, 2-for-1 pizza night: good food for less around Ubud.
            Tell them The Ubudian sent you.
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
            Quiet today. This week&apos;s deals are below.
          </p>
        )}
      </section>

      {(week.length > 0 || everyDay.length > 0 || askDays.length > 0) && (
        <section className="bg-brand-warm-cream px-4 py-12 dark:bg-transparent">
          <div className="mx-auto max-w-3xl sm:px-2">
            <h2 className="font-serif text-2xl text-brand-deep-green dark:text-brand-gold sm:text-3xl">
              The rest of the week
            </h2>
            <div className="mt-6 divide-y divide-brand-gold/20 border-y border-brand-gold/20">
              {week.map((d) => (
                <DayGroup key={d.day} label={WEEKDAY_NAMES[d.day]} count={d.items.length}>
                  {d.items.map((s) => (
                    <SpecialCard key={s.id} special={s} showDays={false} />
                  ))}
                </DayGroup>
              ))}
              {everyDay.length > 0 && (
                <DayGroup label="Every day" count={everyDay.length}>
                  {everyDay.map((s) => (
                    <SpecialCard key={s.id} special={s} showDays={false} />
                  ))}
                </DayGroup>
              )}
            </div>

            {askDays.length > 0 && (
              <div className="mt-12">
                <h2 className="font-serif text-xl text-brand-deep-green dark:text-brand-gold sm:text-2xl">
                  Days to confirm: ask the venue
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Real deals whose source gives no days yet. Check the days with the venue before you go.
                </p>
                <div className="mt-4 border-y border-brand-gold/20">
                  <DayGroup label="Show them" count={askDays.length}>
                    {askDays.map((s) => (
                      <SpecialCard key={s.id} special={s} showDays={false} />
                    ))}
                  </DayGroup>
                </div>
              </div>
            )}
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
          {/* Renders nothing until WHATSAPP_CHANNEL_URL is set. */}
          <ChannelFollow className="mx-auto mt-8 max-w-md" />
        </div>
      </section>

      <section className="bg-brand-pale-green px-4 py-14 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="font-serif text-2xl text-brand-deep-green sm:text-3xl">Run a restaurant or café in Ubud?</h2>
          <p className="mt-3 text-brand-charcoal-light">
            List your food, café or wellness deal for free. It shows here on the days it runs,
            and we check it with you once a month so nothing goes stale. We don&apos;t list drink deals.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/tonight/add">Add your deal</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

/** A folded day: the name and count show; the deals open on tap. No JS needed. */
function DayGroup({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  return (
    <details className="group py-1">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 [&::-webkit-details-marker]:hidden">
        <span className="font-serif text-lg text-brand-deep-green dark:text-brand-gold">{label}</span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          {count} {count === 1 ? "deal" : "deals"}
          <span aria-hidden className="transition-transform group-open:rotate-180">⌄</span>
        </span>
      </summary>
      <div className="space-y-4 pb-5 pt-1">{children}</div>
    </details>
  );
}
