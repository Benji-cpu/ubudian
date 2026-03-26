import { createClient } from "@/lib/supabase/server";
import { QuizContainer } from "@/components/quiz/quiz-container";
import type { Event, Tour, Story, Experience } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Your Ubud Spirit | The Ubudian",
  description:
    "Take the 90-second quiz to find your Ubud archetype — Seeker, Explorer, Creative, Connector, or Epicurean — and discover ceremonies, workshops, and experiences matched to your spirit.",
};

export default async function QuizPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [eventsRes, toursRes, storiesRes, experiencesRes] = await Promise.all([
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
    supabase
      .from("experiences")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(12),
  ]);

  const events = (eventsRes.data ?? []) as Event[];
  const tours = (toursRes.data ?? []) as Tour[];
  const stories = (storiesRes.data ?? []) as Story[];
  const experiences = (experiencesRes.data ?? []) as Experience[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-off-white to-brand-cream">
      <QuizContainer events={events} tours={tours} stories={stories} experiences={experiences} />
    </div>
  );
}
