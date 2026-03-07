import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ARCHETYPES, ARCHETYPE_IDS } from "@/lib/quiz-data";
import { getEventsForArchetype, getToursForArchetype, getStoriesForArchetype } from "@/lib/quiz-helpers";
import { QuizArchetypeCard } from "@/components/quiz/quiz-archetype-card";
import { EventCard } from "@/components/events/event-card";
import { TourCard } from "@/components/tours/tour-card";
import { StoryCard } from "@/components/stories/story-card";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/constants";
import type { ArchetypeId, Event, Tour, Story } from "@/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ archetype: string }>;
}

export async function generateStaticParams() {
  return ARCHETYPE_IDS.map((id) => ({ archetype: id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { archetype: slug } = await params;
  const archetype = ARCHETYPES[slug as ArchetypeId];
  if (!archetype) return {};

  return {
    title: `${archetype.name} — Ubud Spirit | The Ubudian`,
    description: archetype.tagline + ". " + archetype.description.slice(0, 150) + "...",
    openGraph: {
      title: `I'm ${archetype.name}! Discover Your Ubud Spirit`,
      description: archetype.tagline,
      url: `${SITE_URL}/quiz/results/${slug}`,
      images: [
        {
          url: `${SITE_URL}/images/og/${slug}.jpg`,
          width: 1200,
          height: 630,
          alt: archetype.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `I'm ${archetype.name}! Discover Your Ubud Spirit`,
      description: archetype.tagline,
    },
  };
}

export default async function ArchetypeResultPage({ params }: PageProps) {
  const { archetype: slug } = await params;
  const archetype = ARCHETYPES[slug as ArchetypeId];
  if (!archetype) notFound();

  let events: Event[] = [];
  let tours: Tour[] = [];
  let stories: Story[] = [];

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const [eventsRes, toursRes, storiesRes] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("status", "approved")
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(20),
      supabase
        .from("tours")
        .select("*")
        .eq("is_active", true)
        .limit(12),
      supabase
        .from("stories")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(12),
    ]);

    events = (eventsRes.data ?? []) as Event[];
    tours = (toursRes.data ?? []) as Tour[];
    stories = (storiesRes.data ?? []) as Story[];
  } catch {
    // Supabase unreachable — render with empty recommendations
  }

  const matchedEvents = getEventsForArchetype(events, archetype.id);
  const matchedTours = getToursForArchetype(tours, archetype.id);
  const matchedStories = getStoriesForArchetype(stories, archetype.id);
  const otherArchetypes = ARCHETYPE_IDS.filter((id) => id !== archetype.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-off-white to-brand-cream">
      <div className="mx-auto max-w-3xl px-4 py-12">
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
              Ubud Spirit
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

        {/* Take the quiz CTA */}
        <div className="mt-8 rounded-xl border border-brand-gold/30 bg-brand-gold/5 p-6 text-center">
          <p className="font-serif text-lg text-brand-charcoal">
            Not sure if you&apos;re {archetype.name}?
          </p>
          <Button asChild className="mt-3">
            <Link href="/quiz">Take the Quiz</Link>
          </Button>
        </div>

        {/* Recommended events */}
        {matchedEvents.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
              Events for {archetype.name}
            </h2>
            <div className="mt-6 space-y-3">
              {matchedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Recommended tours */}
        {matchedTours.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
              Tours for {archetype.name}
            </h2>
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
            <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
              Humans of Ubud for {archetype.name}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matchedStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>
        )}

        {/* Other archetypes */}
        <div className="mt-16">
          <h2 className="text-center font-serif text-2xl font-medium text-brand-charcoal">
            Explore Other Spirits
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {otherArchetypes.map((id) => (
              <QuizArchetypeCard key={id} archetype={ARCHETYPES[id]} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
