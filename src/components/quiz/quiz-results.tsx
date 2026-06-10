"use client";

import Image from "next/image";
import Link from "next/link";
import { ARCHETYPES, ARCHETYPE_IDS } from "@/lib/quiz-data";
import { getEventsForArchetype, getToursForArchetype, getStoriesForArchetype, getExperiencesForArchetype } from "@/lib/quiz-helpers";
import { QuizShareButtons } from "./quiz-share-buttons";
import { EventCard } from "@/components/events/event-card";
import { TourCard } from "@/components/tours/tour-card";
import { StoryCard } from "@/components/stories/story-card";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/constants";
import type { ArchetypeId, QuizScores, Event, Tour, Story, Experience, UserSegment } from "@/types";

interface QuizResultsProps {
  primary: ArchetypeId;
  secondary: ArchetypeId;
  scores: QuizScores;
  events: Event[];
  tours: Tour[];
  stories: Story[];
  experiences: Experience[];
  onRetake: () => void;
  userSegment?: UserSegment | null;
  submitFailed?: boolean;
}

export function QuizResults({
  primary,
  secondary,
  scores,
  events,
  tours,
  stories,
  experiences,
  onRetake,
  userSegment,
  submitFailed,
}: QuizResultsProps) {
  const archetype = ARCHETYPES[primary];
  const secondaryArchetype = ARCHETYPES[secondary];
  const maxScore = Math.max(...Object.values(scores));
  const shareUrl = `${SITE_URL}/quiz/results/${primary}`;

  const matchedExperiences = getExperiencesForArchetype(experiences, primary);
  const matchedEvents = getEventsForArchetype(events, primary);
  const matchedTours = getToursForArchetype(tours, primary);
  const matchedStories = getStoriesForArchetype(stories, primary);

  const segmentCTA = (() => {
    const segment = userSegment || "visiting";

    if (segment === "curious") {
      return (
        <div className="space-y-3">
          <Button asChild size="lg">
            <Link href="/login?redirect=/dashboard">
              Get your personalized Ubud guide
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Or{" "}
            <Link
              href="/login?redirect=/dashboard"
              className="font-semibold text-brand-deep-green underline underline-offset-4 hover:text-brand-gold"
            >
              create an account
            </Link>{" "}
            to save your archetype
          </p>
        </div>
      );
    }

    if (segment === "local") {
      return (
        <Button asChild size="lg">
          <Link href="/login?redirect=/dashboard">
            Sign in to unlock your personalized dashboard
          </Link>
        </Button>
      );
    }

    // visiting or legacy (null)
    return (
      <div className="space-y-3">
        <Button asChild size="lg">
          <Link href="/login?redirect=/dashboard">
            Sign in to see your full event feed
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          We also send a weekly email with events matched to your spirit.
        </p>
      </div>
    );
  })();

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl">
        <div className="relative aspect-[2/1] sm:aspect-[5/2]">
          <Image
            src={archetype.hero_image}
            alt={archetype.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">
            Your Ubud Spirit
          </p>
          <h1 className="mt-1 font-serif text-4xl font-medium text-white sm:text-5xl">
            {archetype.name}
          </h1>
          <p className="mt-2 font-serif text-lg italic text-white/90">
            {archetype.tagline}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-lg leading-relaxed text-muted-foreground">
        {archetype.description}
      </p>

      {/* Secondary archetype */}
      <p className="mt-4 text-base text-muted-foreground/80">
        With a touch of <strong className="text-foreground">{secondaryArchetype.name}</strong>{" "}
        — {secondaryArchetype.tagline.toLowerCase()}.
      </p>

      {/* Score bars */}
      <div className="mt-8 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your Spirit Breakdown
        </h3>
        {ARCHETYPE_IDS.map((id) => {
          const a = ARCHETYPES[id];
          const pct = maxScore > 0 ? (scores[id] / maxScore) * 100 : 0;
          return (
            <div key={id} className="flex items-center gap-3">
              <span className="w-28 text-sm text-muted-foreground">{a.name}</span>
              <div className="flex-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      id === primary ? "bg-brand-gold" : "bg-brand-deep-green/40"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="w-8 text-right text-sm font-medium text-foreground">
                {scores[id]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Conversion block — matched events preview + gated CTA */}
      <div className="mt-10">
        <h3 className="font-serif text-2xl font-medium text-brand-deep-green dark:text-brand-gold">
          Your custom spread
        </h3>
        <p className="mt-2 text-muted-foreground">
          A handful of gatherings — and the journeys further down — picked for{" "}
          {archetype.name}. Sign in to keep this spread on your profile and
          we&apos;ll keep tuning it; if you left your email, it&apos;s already on
          its way to your inbox.
        </p>
        {submitFailed && (
          <p className="mt-2 text-sm italic text-muted-foreground/70">
            We couldn&apos;t sync your result just now — it&apos;s saved on this
            device.
          </p>
        )}

        {/* Show first 3 event cards */}
        {matchedEvents.length > 0 && (
          <div className="mt-6 space-y-3">
            {matchedEvents.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Gated card — blurred preview with lock */}
        <div className="relative mt-3 overflow-hidden rounded-xl border border-border bg-card p-4">
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-deep-green/10">
              <svg
                className="h-5 w-5 text-brand-deep-green"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <p className="mt-2 text-center text-sm font-medium text-foreground">
              {matchedEvents.length > 3
                ? `${matchedEvents.length - 3} more events matched to your spirit`
                : "More events matched weekly to your spirit"}
            </p>
          </div>
          {/* Blurred placeholder content */}
          <div className="select-none opacity-30" aria-hidden="true">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
            <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
          </div>
        </div>

        {/* Segment-aware CTA */}
        <div className="mt-6 text-center">
          {segmentCTA}
        </div>
      </div>

      {/* Share */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6 text-center">
        <p className="mb-4 font-serif text-lg text-foreground">Share your Ubud Spirit</p>
        <QuizShareButtons archetypeName={archetype.name} url={shareUrl} />
      </div>

      {/* Recommended experiences */}
      {matchedExperiences.length > 0 && (
        <div className="mt-12">
          <h3 className="font-serif text-2xl font-medium text-brand-deep-green dark:text-brand-gold">
            Experiences for {archetype.name}
          </h3>
          <p className="mt-2 text-muted-foreground">
            Based on your archetype — the practices, ceremonies, and gatherings that&apos;ll feel like home.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matchedExperiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended tours */}
      {matchedTours.length > 0 && (
        <div className="mt-12">
          <h3 className="font-serif text-2xl font-medium text-brand-deep-green dark:text-brand-gold">
            Tours for {archetype.name}
          </h3>
          <p className="mt-2 text-muted-foreground">
            Get out of the ceremony and into the landscape.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matchedTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended stories */}
      {matchedStories.length > 0 && (
        <div className="mt-12">
          <h3 className="font-serif text-2xl font-medium text-brand-deep-green dark:text-brand-gold">
            Humans of Ubud for {archetype.name}
          </h3>
          <p className="mt-2 text-muted-foreground">
            The humans behind the events you&apos;ll love.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matchedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      )}

      {/* Retake */}
      <div className="mt-12 text-center">
        <Button variant="outline" onClick={onRetake}>
          Retake Quiz
        </Button>
      </div>
    </div>
  );
}
