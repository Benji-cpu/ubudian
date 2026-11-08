"use client";

import Image from "next/image";
import Link from "next/link";
import { ARCHETYPES, ARCHETYPE_IDS } from "@/lib/quiz-data";
import { QuizShareButtons } from "./quiz-share-buttons";
import { YourWeek } from "./your-week";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/constants";
import type { ArchetypeId, QuizScores, Event, UserSegment } from "@/types";

interface QuizResultsProps {
  primary: ArchetypeId;
  secondary: ArchetypeId;
  scores: QuizScores;
  /** The next gatherings for `primary` this week, already matched (`nextForArchetype`). */
  weekEvents: Event[];
  onRetake: () => void;
  userSegment?: UserSegment | null;
  submitFailed?: boolean;
  /** They left their email in the quiz, so they already get the weekly email. */
  subscribed?: boolean;
}

export function QuizResults({
  primary,
  secondary,
  scores,
  weekEvents,
  onRetake,
  userSegment,
  submitFailed,
  subscribed,
}: QuizResultsProps) {
  const archetype = ARCHETYPES[primary];
  const secondaryArchetype = ARCHETYPES[secondary];
  const maxScore = Math.max(...Object.values(scores));
  const shareUrl = `${SITE_URL}/quiz/results/${primary}`;

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

    // visiting or legacy (null). The weekly email is offered right above, under the week's events.
    return (
      <Button asChild size="lg">
        <Link href="/login?redirect=/dashboard">
          Sign in to see your full event feed
        </Link>
      </Button>
    );
  })();

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl">
        <div className="relative aspect-[2/1] sm:aspect-[5/2]">
          {archetype.hero_image ? (
            <Image
              src={archetype.hero_image}
              alt={archetype.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-brand-deep-green" />
          )}
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

      {/* The next five gatherings for this archetype, with the weekly email right under them */}
      <div className="mt-10">
        {/* The email they left in the quiz only counts once the result reached us. */}
        <YourWeek archetypeName={archetype.name} events={weekEvents} subscribed={subscribed && !submitFailed} />
        {submitFailed && (
          <p className="mt-2 text-sm italic text-muted-foreground/70">
            We couldn&apos;t sync your result just now — it&apos;s saved on this
            device.
          </p>
        )}

        {/* Segment-aware CTA */}
        <div className="mt-8 text-center">
          {segmentCTA}
        </div>
      </div>

      {/* Share */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6 text-center">
        <p className="mb-4 font-serif text-lg text-foreground">Share your Ubud Spirit</p>
        <QuizShareButtons archetypeName={archetype.name} url={shareUrl} />
      </div>



      {/* Retake */}
      <div className="mt-12 text-center">
        <Button variant="outline" onClick={onRetake}>
          Retake Quiz
        </Button>
      </div>
    </div>
  );
}
