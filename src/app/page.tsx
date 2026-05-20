import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { PageHero } from "@/components/layout/page-hero";
import { HomepageScrollSnap } from "@/components/homepage/scroll-snap";
import { FeaturedStories } from "@/components/homepage/featured-stories";
import { FeaturedEvents } from "@/components/homepage/featured-events";
import { FeaturedTours } from "@/components/homepage/featured-tours";
import { FeaturedJourneys } from "@/components/homepage/featured-journeys";
import { QuizCtaHomepage } from "@/components/quiz/quiz-cta-homepage";
import { QuizPrompt } from "@/components/quiz/quiz-prompt";
import { StoryCardSkeleton } from "@/components/skeletons/story-card-skeleton";
import { EventCardSkeleton } from "@/components/skeletons/event-card-skeleton";
import { TourCardSkeleton } from "@/components/skeletons/tour-card-skeleton";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "The Ubudian — Ubud's Conscious Community",
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "The Ubudian — Ubud's Conscious Community",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Ubudian — Ubud's Conscious Community",
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

function StoriesSkeleton() {
  return (
    <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <StoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="mt-10 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

function ToursSkeleton() {
  return (
    <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <TourCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const settings = await getSiteSettings();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomepageScrollSnap />
      <div>
        {/* Canopy (Hero) */}
        <PageHero
          variant="deep-green"
          title="The Ubudian"
          subtitle={<>Your guide to Ubud&apos;s conscious community.</>}
          body={
            <>
              Ceremonies, sound journeys, ecstatic dance, tantra workshops, and everything
              in between —{" "}
              <Link href="/events" className="text-brand-off-white underline decoration-brand-off-white/30 underline-offset-2 transition-colors hover:text-brand-gold hover:decoration-brand-gold">events</Link>
              {settings.stories_enabled && (
                <>
                  ,{" "}
                  <Link href="/stories" className="text-brand-off-white underline decoration-brand-off-white/30 underline-offset-2 transition-colors hover:text-brand-gold hover:decoration-brand-gold">stories</Link>
                </>
              )}
              {settings.tours_enabled && (
                <>
                  ,{" "}
                  <Link href="/tours" className="text-brand-off-white underline decoration-brand-off-white/30 underline-offset-2 transition-colors hover:text-brand-gold hover:decoration-brand-gold">tours</Link>
                </>
              )}
              , and a{" "}
              <Link href="#newsletter" className="text-brand-off-white underline decoration-brand-off-white/30 underline-offset-2 transition-colors hover:text-brand-gold hover:decoration-brand-gold">weekly newsletter</Link>.
            </>
          }
          actions={
            <>
              <Button
                asChild
                size="lg"
                className="bg-brand-gold text-[#2C4A3E] hover:bg-brand-gold/90 dark:bg-brand-gold dark:text-[#2C4A3E] dark:hover:bg-brand-gold/90"
              >
                <Link href="/experiences/3-day-ubud-reset">
                  Start with a 3-Day Reset &rarr;
                </Link>
              </Button>
              <Link
                href="/quiz"
                className="font-serif text-sm italic text-[#FAF5EC]/90 underline decoration-[#FAF5EC]/30 underline-offset-4 transition-colors hover:text-brand-gold hover:decoration-brand-gold/60"
              >
                Or take the 6-question quiz
              </Link>
            </>
          }
          showScrollDot
        />

        {/* Earth (Events) — moved up to section 2 */}
        <section className="flex min-h-[100dvh] items-center bg-gradient-to-b from-brand-warm-cream to-brand-off-white px-4 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-3xl">
            <div className="text-center">
              <div className="mx-auto mb-8 h-px w-16 bg-brand-gold/40" />
              <h2 className="font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">
                What&apos;s Happening in Ubud
              </h2>
              <p className="mt-4 text-lg text-brand-charcoal-light">
                Temple nights, sound journeys, embodiment workshops, breathwork,
                medicine song circles — all in one place, updated daily from the community.
              </p>
            </div>

            <Suspense fallback={<EventsSkeleton />}>
              <FeaturedEvents />
            </Suspense>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/events">Browse All Events</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/events/submit">Submit an Event</Link>
              </Button>
            </div>
            <div className="mx-auto mt-8 h-px w-16 bg-brand-gold/40" />
          </div>
        </section>

        {/* Journeys — curated paths into Ubud */}
        <section className="flex min-h-[100dvh] items-center bg-brand-cream px-4 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl">
            <div className="text-center">
              <p className="font-serif text-xs uppercase tracking-[0.25em] text-brand-gold">
                Journeys
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">
                Curated paths into Ubud
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-brand-charcoal-light">
                A handful of carefully shaped multi-day threads — temples, teachers,
                rituals, and rest — to walk through the conscious-community scene
                without drowning in choice.
              </p>
            </div>

            <Suspense fallback={<ToursSkeleton />}>
              <FeaturedJourneys />
            </Suspense>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/experiences">Explore all journeys</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/experiences/3-day-ubud-reset">Start the 3-Day Reset</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Garden (Humans of Ubud) */}
        {settings.stories_enabled && (
          <section className="flex min-h-[100dvh] items-center bg-brand-cream px-4 py-20 sm:py-28">
            <div className="mx-auto w-full max-w-6xl">
              <div className="text-center">
                <h2 className="font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">
                  Humans of Ubud
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-brand-charcoal-light">
                  Mask carvers, breathwork guides, tantra facilitators, organic farmers,
                  and the dreamers who followed something to Bali and stayed.
                </p>
              </div>

              <Suspense fallback={<StoriesSkeleton />}>
                <FeaturedStories />
              </Suspense>

              <div className="mt-10 text-center">
                <Link
                  href="/stories"
                  className="font-semibold text-brand-deep-green underline underline-offset-4 transition-colors hover:text-brand-gold"
                >
                  Read their stories
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Quiz CTA — moved down to after content */}
        <QuizCtaHomepage />

        {/* Path (Tours) */}
        {settings.tours_enabled && (
          <section className="flex min-h-[100dvh] items-center bg-brand-cream px-4 py-20 sm:py-28">
            <div className="mx-auto w-full max-w-6xl">
              <div className="text-center">
                <h2 className="font-serif text-3xl italic text-brand-deep-green sm:text-4xl">
                  Explore the Land Beneath the Rituals
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-brand-charcoal-light">
                  Rice terraces, water temples, jungle treks, and food trails
                  with guides who actually live here — the Ubud that exists between
                  the ceremonies.
                </p>
              </div>

              <Suspense fallback={<ToursSkeleton />}>
                <FeaturedTours />
              </Suspense>

              <div className="mt-10 text-center">
                <Link
                  href="/tours"
                  className="font-semibold text-brand-deep-green underline underline-offset-4 transition-colors hover:text-brand-gold"
                >
                  Explore tours
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Water (Newsletter) — moved to bottom */}
        <section id="newsletter" className="flex min-h-[100dvh] items-center bg-brand-pale-green px-4 py-20 sm:py-28 scroll-mt-14">
          <div className="mx-auto w-full max-w-xl text-center">
            <h2 className="font-serif text-3xl italic text-brand-deep-green sm:text-4xl">
              Flow with us.
            </h2>
            <p className="mt-4 text-lg text-brand-charcoal-light">
              One email a week with the events, stories, and community happenings
              that matter — so you never hear about the good ones after they sell out.
            </p>
            <NewsletterSignup className="mx-auto mt-8 max-w-md" />
            <p className="mt-3 text-sm text-brand-charcoal-light/60">
              No spam, unsubscribe anytime.
            </p>
          </div>
        </section>
      </div>
      <QuizPrompt />
    </>
  );
}
