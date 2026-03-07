import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getEventsForArchetype, getStoriesForArchetype } from "@/lib/quiz-helpers";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { EventCard } from "@/components/events/event-card";
import { StoryCard } from "@/components/stories/story-card";
import { Button } from "@/components/ui/button";
import type { ArchetypeId, Event, Story, QuizResultRecord } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Dashboard | The Ubudian",
};

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Fetch quiz result, submitted events count, saved events count in parallel
  const [quizRes, submittedRes, savedRes] = await Promise.all([
    supabase
      .from("quiz_results")
      .select("*")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("submitted_by_email", profile.email),
    supabase
      .from("saved_events")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id),
  ]);

  const quizResult = (quizRes.data?.[0] ?? null) as QuizResultRecord | null;
  const archetype = quizResult?.primary_archetype ?? null;
  const submittedCount = submittedRes.count ?? 0;
  const savedCount = savedRes.count ?? 0;

  // Fetch personalized content if archetype exists
  let matchedEvents: Event[] = [];
  let matchedStories: Story[] = [];

  if (archetype) {
    const today = new Date().toISOString().split("T")[0];

    const [eventsRes, storiesRes] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("status", "approved")
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(20),
      supabase
        .from("stories")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(12),
    ]);

    const events = (eventsRes.data ?? []) as Event[];
    const stories = (storiesRes.data ?? []) as Story[];

    matchedEvents = getEventsForArchetype(events, archetype as ArchetypeId, 4);
    matchedStories = getStoriesForArchetype(stories, archetype as ArchetypeId, 3);
  }

  return (
    <div className="space-y-8">
      <DashboardHeader profile={profile} archetype={archetype as ArchetypeId | null} />

      <DashboardStats
        archetype={archetype as ArchetypeId | null}
        submittedCount={submittedCount}
        savedCount={savedCount}
      />

      {!archetype && (
        <div className="rounded-xl border border-brand-gold/30 bg-brand-gold/5 p-6 text-center">
          <h2 className="font-serif text-xl font-medium text-brand-charcoal">
            Discover Your Ubud Spirit
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Take our 90-second quiz to find your archetype and get personalized recommendations.
          </p>
          <Button asChild className="mt-4">
            <Link href="/quiz">Take the Quiz</Link>
          </Button>
        </div>
      )}

      {matchedEvents.length > 0 && (
        <div>
          <h2 className="font-serif text-xl font-medium text-brand-deep-green">
            For You — Upcoming Events
          </h2>
          <div className="mt-4 space-y-3">
            {matchedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {matchedStories.length > 0 && (
        <div>
          <h2 className="font-serif text-xl font-medium text-brand-deep-green">
            Stories You&apos;ll Love
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            {matchedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
