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
import type { ArchetypeId, QuizScores, Event, Tour, Story, Experience } from "@/types";

interface QuizResultsProps {
  primary: ArchetypeId;
  secondary: ArchetypeId;
  scores: QuizScores;
  events: Event[];
  tours: Tour[];
  stories: Story[];
  experiences: Experience[];
  onRetake: () => void;
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
}: QuizResultsProps) {
  const archetype = ARCHETYPES[primary];
  const secondaryArchetype = ARCHETYPES[secondary];
  const maxScore = Math.max(...Object.values(scores));
  const shareUrl = `${SITE_URL}/quiz/results/${primary}`;

  const matchedExperiences = getExperiencesForArchetype(experiences, primary);
  const matchedEvents = getEventsForArchetype(events, primary);
  const matchedTours = getToursForArchetype(tours, primary);
  const matchedStories = getStoriesForArchetype(stories, primary);

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
      <p className="text-lg leading-relaxed text-brand-charcoal-light">
        {archetype.description}
      </p>

      {/* Secondary archetype */}
      <p className="mt-4 text-base text-brand-charcoal-light/80">
        With a touch of <strong className="text-brand-charcoal">{secondaryArchetype.name}</strong>{" "}
        — {secondaryArchetype.tagline.toLowerCase()}.
      </p>

      {/* Score bars */}
      <div className="mt-8 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-charcoal-light">
          Your Spirit Breakdown
        </h3>
        {ARCHETYPE_IDS.map((id) => {
          const a = ARCHETYPES[id];
          const pct = maxScore > 0 ? (scores[id] / maxScore) * 100 : 0;
          return (
            <div key={id} className="flex items-center gap-3">
              <span className="w-28 text-sm text-brand-charcoal-light">{a.name}</span>
              <div className="flex-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-brand-cream">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      id === primary ? "bg-brand-gold" : "bg-brand-deep-green/40"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="w-8 text-right text-sm font-medium text-brand-charcoal">
                {scores[id]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Share */}
      <div className="mt-8 rounded-xl border border-brand-cream bg-card p-6 text-center">
        <p className="mb-4 font-serif text-lg text-brand-charcoal">Share your Ubud Spirit</p>
        <QuizShareButtons archetypeName={archetype.name} url={shareUrl} />
      </div>

      {/* Recommended experiences */}
      {matchedExperiences.length > 0 && (
        <div className="mt-12">
          <h3 className="font-serif text-2xl font-medium text-brand-deep-green">
            Experiences for {archetype.name}
          </h3>
          <p className="mt-2 text-brand-charcoal-light">
            Based on your archetype — the practices, ceremonies, and gatherings that&apos;ll feel like home.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matchedExperiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended events */}
      {matchedEvents.length > 0 && (
        <div className="mt-12">
          <h3 className="font-serif text-2xl font-medium text-brand-deep-green">
            Events for {archetype.name}
          </h3>
          <p className="mt-2 text-brand-charcoal-light">
            Happening soon in Ubud.
          </p>
          <div className="mt-6 space-y-3">
            {matchedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/events"
              className="text-sm font-semibold text-brand-deep-green underline underline-offset-4 hover:text-brand-gold"
            >
              Browse all events
            </Link>
          </div>
        </div>
      )}

      {/* Recommended tours */}
      {matchedTours.length > 0 && (
        <div className="mt-12">
          <h3 className="font-serif text-2xl font-medium text-brand-deep-green">
            Tours for {archetype.name}
          </h3>
          <p className="mt-2 text-brand-charcoal-light">
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
          <h3 className="font-serif text-2xl font-medium text-brand-deep-green">
            Humans of Ubud for {archetype.name}
          </h3>
          <p className="mt-2 text-brand-charcoal-light">
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
