import { createClient } from "@/lib/supabase/server";
import { QuizContainer } from "@/components/quiz/quiz-container";
import type { Event, Tour, Story } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Your Ubud Spirit | The Ubudian",
  description:
    "Take our 90-second quiz to discover your Ubud archetype — Seeker, Explorer, Creative, Connector, or Epicurean — and get personalized recommendations for events, tours, and experiences.",
};

export default async function QuizPage() {
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

  const events = (eventsRes.data ?? []) as Event[];
  const tours = (toursRes.data ?? []) as Tour[];
  const stories = (storiesRes.data ?? []) as Story[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-off-white to-brand-cream">
      <QuizContainer events={events} tours={tours} stories={stories} />
    </div>
  );
}
