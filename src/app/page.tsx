import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { FeaturedEvents } from "@/components/homepage/featured-events";
import { DealsTodayRail } from "@/components/homepage/deals-today-rail";
import { EventCardSkeleton } from "@/components/skeletons/event-card-skeleton";
import { nowInBali } from "@/lib/events/bali-time";
import { specialsForToday } from "@/lib/specials";
import { getLiveSpecials } from "@/lib/specials/queries";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

export const metadata: Metadata = {
  title: "The Ubudian — today's deals and gatherings in Ubud",
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "The Ubudian — today's deals and gatherings in Ubud",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Ubudian — today's deals and gatherings in Ubud",
    description: SITE_DESCRIPTION,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  sameAs: [],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ubud",
    addressRegion: "Bali",
    addressCountry: "ID",
  },
};

function formatToday(dateStr: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${dateStr}T00:00:00Z`)
  );
}

function SectionHead({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
      >
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/**
 * "Ubud, today" — the app-style home (UI refresh, 5 Oct 2026, after
 * todo.today): one short photo hero with live counts, then the three things
 * people come back for, each owned by its own room: deals (Ubudian · deals),
 * gatherings (Ubudian · events) and the weekly email (Ubudian · newsletter).
 */
export default async function HomePage() {
  const now = nowInBali();
  const live = await getLiveSpecials();
  const dealsToday = specialsForToday(live, now);
  const venues = new Set(live.map((d) => d.venue_name)).size;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <Image
          src="/images/home/hero-dinner.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {formatToday(now.dateStr)} · checked daily
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] text-white sm:text-6xl">
            Ubud, <span className="text-brand-gold">today.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            The good deals and the gatherings worth going to, in one place. Free.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-brand-charcoal hover:bg-white/90">
              <Link href="/deals">
                Today&apos;s deals <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/events">What&apos;s on</Link>
            </Button>
          </div>
          <dl className="mt-10 flex gap-8 text-white">
            <div>
              <dt className="sr-only">Deals today</dt>
              <dd className="text-2xl font-semibold">{dealsToday.length}</dd>
              <dd className="text-xs text-white/65">Deals today</dd>
            </div>
            <div className="border-l border-white/20 pl-8">
              <dt className="sr-only">Venues</dt>
              <dd className="text-2xl font-semibold">{venues}</dd>
              <dd className="text-xs text-white/65">Venues listed</dd>
            </div>
            <div className="border-l border-white/20 pl-8">
              <dt className="sr-only">Cost to use</dt>
              <dd className="text-2xl font-semibold">Free</dd>
              <dd className="text-xs text-white/65">To use</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Deals */}
      <section className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
        <SectionHead title="Deals today" href="/deals" cta="This week" />
        <DealsTodayRail deals={dealsToday} />
      </section>

      {/* Gatherings */}
      <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
        <SectionHead title="What's on" href="/events" cta="All events" />
        <Suspense
          fallback={
            <div className="mt-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <FeaturedEvents />
        </Suspense>
      </section>

      {/* Weekly email */}
      <section id="newsletter" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14 sm:px-6">
        <div className="rounded-3xl bg-brand-deep-green px-6 py-10 text-center sm:px-12">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">The week in Ubud, once a week</h2>
          <p className="mx-auto mt-3 max-w-md text-white/75">
            The best deals and what&apos;s on, in one short email. No spam, unsubscribe any time.
          </p>
          <NewsletterSignup variant="dark" source="home" className="mx-auto mt-6 max-w-md" />
          <Link href="/newsletter" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white/70 hover:text-white">
            See this week&apos;s issue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* The rest of the site */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/retreats", title: "Retreats", body: "Free self-guided days around Ubud." },
            { href: "/quiz", title: "Find your Ubud", body: "Six questions, a plan that fits you." },
            { href: "/tonight/add", title: "Run a venue?", body: "List your deal free. It shows on the days it runs." },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-2xl border bg-card p-5 transition-colors hover:border-foreground/20"
            >
              <p className="font-semibold text-foreground">{c.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground/60 group-hover:text-foreground">
                Open <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
