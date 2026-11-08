import { QuizContainer } from "@/components/quiz/quiz-container";
import { getPublicListings } from "@/lib/events/timetable-queries";
import { nextForArchetype, weekAhead } from "@/lib/events/timetable";
import { ARCHETYPE_IDS } from "@/lib/quiz-data";
import type { ArchetypeId, Event } from "@/types";
import type { Metadata } from "next";

// "Your week in Ubud" on the result is read off the Bali clock: never a cached copy.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover Your Ubud Spirit",
  description:
    "Take the 90-second quiz to find your Ubud archetype — Seeker, Explorer, Creative, Connector, or Epicurean — and discover the events, ceremonies, and community that match your energy.",
};

export default async function QuizPage() {
  // The result shows the next five gatherings for the reader's archetype. Pick
  // them here, so the browser gets five per archetype instead of the whole week.
  const week = weekAhead(await getPublicListings());
  const weekFor = Object.fromEntries(ARCHETYPE_IDS.map((id) => [id, nextForArchetype(week, id)])) as Record<ArchetypeId, Event[]>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-off-white to-brand-cream dark:from-background dark:to-background">
      <QuizContainer weekFor={weekFor} />
    </div>
  );
}
