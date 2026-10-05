import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { nowInBali } from "@/lib/events/bali-time";
import { formatHours, formatWeekdays } from "@/lib/specials";
import { getLiveSpecials } from "@/lib/specials/queries";
import { DEALS_PATH, pickWeeklyDeals } from "@/lib/email/weekly-deals";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The Ubudian weekly — Ubud's best deals and what's on",
  description:
    "One email every Wednesday morning: the week's best food and drink deals in Ubud, and the gatherings worth clearing an evening for. Free.",
  alternates: { canonical: `${SITE_URL}/newsletter` },
};

/**
 * The newsletter's own sign-up page — the link and QR target for flyers and
 * chats. It previews real deals from this week's issue so the promise is
 * concrete, and tags sign-ups `newsletter_page`.
 */
export default async function NewsletterPage() {
  const preview = pickWeeklyDeals(await getLiveSpecials(), nowInBali().dayOfWeek, 3);

  return (
    <div>
      <section className="bg-brand-deep-green px-4 py-14 text-center sm:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
            Every Wednesday morning
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-brand-off-white sm:text-5xl">
            Ubud&apos;s best deals, and what&apos;s on
          </h1>
          <p className="mt-4 text-lg text-brand-off-white/80">
            One short email: the week&apos;s food and drink deals, then the ceremonies,
            music and gatherings worth clearing an evening for. Free.
          </p>
          <NewsletterSignup
            variant="dark"
            source="newsletter_page"
            className="mx-auto mt-8 max-w-md text-left"
          />
          <p className="mt-3 text-sm text-brand-off-white/60">One email a week. Unsubscribe in one tap.</p>
        </div>
      </section>

      {preview.length > 0 && (
        <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <h2 className="font-serif text-2xl text-brand-deep-green dark:text-brand-gold">
            Deals on now
          </h2>
          <ul className="mt-6 space-y-4">
            {preview.map((deal) => {
              const when = [formatWeekdays(deal.weekdays), formatHours(deal.start_time, deal.end_time)]
                .filter(Boolean)
                .join(" · ");
              return (
                <li
                  key={deal.id}
                  className="rounded-lg border border-brand-gold/20 bg-card px-5 py-4"
                >
                  <p className="font-serif text-lg text-brand-deep-green dark:text-brand-gold">
                    {deal.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[deal.venue_name, deal.venue_area].filter(Boolean).join(" · ")}
                    {when ? ` · ${when}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            Each Wednesday&apos;s email brings the week&apos;s deals and events.{" "}
            <Link href={DEALS_PATH} className="font-medium text-brand-deep-green underline dark:text-brand-gold">
              See every deal
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
