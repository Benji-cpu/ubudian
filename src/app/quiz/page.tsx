import { createClient } from "@/lib/supabase/server";
import { QuizContainer } from "@/components/quiz/quiz-container";
import { stripEmbeddings } from "@/lib/events/strip-embedding";
import type { Event } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Your Ubud Spirit",
  description:
    "Take the 90-second quiz to find your Ubud archetype — Seeker, Explorer, Creative, Connector, or Epicurean — and discover the events, ceremonies, and community that match your energy.",
};

export default async function QuizPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: eventsData } = await supabase
    .from("events")
    .select("*")
    .eq("status", "approved")
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(20);

  const events = stripEmbeddings((eventsData ?? []) as Event[]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-off-white to-brand-cream dark:from-background dark:to-background">
      <QuizContainer events={events} />
    </div>
  );
}
