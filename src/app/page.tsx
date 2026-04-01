import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { HomepageScrollSnap } from "@/components/homepage/scroll-snap";
import { FeaturedStories } from "@/components/homepage/featured-stories";
import { FeaturedEvents } from "@/components/homepage/featured-events";
import { FeaturedTours } from "@/components/homepage/featured-tours";
import { FeaturedExperiences } from "@/components/homepage/featured-experiences";
import { QuizCtaHomepage } from "@/components/quiz/quiz-cta-homepage";
import { StoryCardSkeleton } from "@/components/skeletons/story-card-skeleton";
import { EventCardSkeleton } from "@/components/skeletons/event-card-skeleton";
import { TourCardSkeleton } from "@/components/skeletons/tour-card-skeleton";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

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

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomepageScrollSnap />
      <div className="-mt-14">
        {/* Canopy (Hero) */}
        <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-b from-brand-deep-green via-brand-mid-green to-brand-sage">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-5"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="botanical" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <circle cx="60" cy="60" r="40" fill="none" stroke="#F0EAD6" strokeWidth="0.5" />
                <circle cx="60" cy="60" r="20" fill="none" stroke="#F0EAD6" strokeWidth="0.5" />
                <line x1="60" y1="20" x2="60" y2="100" stroke="#F0EAD6" strokeWidth="0.3" />
                <line x1="20" y1="60" x2="100" y2="60" stroke="#F0EAD6" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#botanical)" />
          </svg>

          <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
            <h1 className="font-serif text-5xl font-normal tracking-wide text-brand-gold sm:text-6xl lg:text-7xl">
              The Ubudian
            </h1>
            <p className="mt-6 font-serif text-xl italic text-brand-cream sm:text-2xl">
              Tantra. Sound journeys. Shadow work. Ecstatic dance. All in one place.
            </p>
            <p className="mx-auto mt-4 max-w-lg text-base text-brand-off-white/70">
              <Link href="/events" className="text-brand-off-white underline decoration-brand-off-white/30 underline-offset-2 transition-colors hover:text-brand-gold hover:decoration-brand-gold">Events</Link>,{" "}
              <Link href="/stories" className="text-brand-off-white underline decoration-brand-off-white/30 underline-offset-2 transition-colors hover:text-brand-gold hover:decoration-brand-gold">stories</Link>,{" "}
              <Link href="/tours" className="text-brand-off-white underline decoration-brand-off-white/30 underline-offset-2 transition-colors hover:text-brand-gold hover:decoration-brand-gold">tours</Link>, and a{" "}
              <Link href="/newsletter" className="text-brand-off-white underline decoration-brand-off-white/30 underline-offset-2 transition-colors hover:text-brand-gold hover:decoration-brand-gold">weekly newsletter</Link>{" "}
              — sound journeys, tantra workshops, medicine song circles, and everything in between.
            </p>
            <Link
              href="/quiz"
              className="mt-6 inline-block font-serif text-sm italic text-brand-gold transition-colors hover:text-brand-cream"
            >
              Take the quiz — find your archetype, find your corner of Ubud &rarr;
            </Link>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div className="animate-pulse-down h-3 w-3 rounded-full bg-brand-gold" />
          </div>
        </section>

        {/* Quiz CTA */}
        <QuizCtaHomepage />

        {/* Transition: Hero → Humans */}
        <p className="bg-brand-cream px-4 py-10 text-center font-serif text-sm italic text-brand-charcoal-light/70">
          Meet the humans behind the ceremonies, the kitchens, and the circles...
        </p>

        {/* Garden (Humans of Ubud) */}
        <section className="bg-brand-cream px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
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

        {/* Transition: Humans → Newsletter */}
        <p className="bg-brand-pale-green px-4 py-10 text-center font-serif text-sm italic text-brand-charcoal-light/70">
          Never miss a full moon ceremony or a last-minute sound bath...
        </p>

        {/* Water (Newsletter) */}
        <section className="flex min-h-[100dvh] items-center bg-brand-pale-green px-4 py-20 sm:py-28">
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

        {/* Transition: Newsletter → Events */}
        <p className="bg-gradient-to-b from-brand-pale-green to-brand-warm-cream px-4 py-10 text-center font-serif text-sm italic text-brand-charcoal-light/70">
          See what the community is gathering for this week...
        </p>

        {/* Earth (Events) */}
        <section className="bg-gradient-to-b from-brand-warm-cream to-brand-off-white px-4 py-20 sm:py-28">
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

        {/* Experiences */}
        <section className="bg-brand-cream px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">
                Ubud Experiences
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-brand-charcoal-light">
                Embodiment workshops, cacao ceremonies, tantric temples, sound journeys — the
                practices that make Ubud unlike anywhere else.
              </p>
            </div>

            <Suspense fallback={<ToursSkeleton />}>
              <FeaturedExperiences />
            </Suspense>

            <div className="mt-10 text-center">
              <Link
                href="/experiences"
                className="font-semibold text-brand-deep-green underline underline-offset-4 transition-colors hover:text-brand-gold"
              >
                View all experiences
              </Link>
            </div>
          </div>
        </section>

        {/* Transition: Experiences → Tours */}
        <p className="bg-brand-cream px-4 py-10 text-center font-serif text-sm italic text-brand-charcoal-light/70">
          When you want to leave the ceremony and explore the land...
        </p>

        {/* Path (Tours) */}
        <section className="bg-brand-cream px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
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
      </div>
    </>
  );
}
