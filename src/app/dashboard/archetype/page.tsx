import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { ARCHETYPES } from "@/lib/quiz-data";
import { ArchetypeScoreBars } from "@/components/dashboard/archetype-score-bars";
import { Button } from "@/components/ui/button";
import type { ArchetypeId, QuizResultRecord } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Spirit | The Ubudian",
};

export default async function ArchetypePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("quiz_results")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const quizResult = (data?.[0] ?? null) as QuizResultRecord | null;

  if (!quizResult) {
    return (
      <div className="py-12 text-center">
        <h1 className="font-serif text-3xl font-medium text-brand-charcoal">
          Discover Your Ubud Spirit
        </h1>
        <p className="mt-3 text-muted-foreground">
          Take our 90-second quiz to find out which Ubud archetype matches your personality.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/quiz">Take the Quiz</Link>
        </Button>
      </div>
    );
  }

  const archetype = ARCHETYPES[quizResult.primary_archetype as ArchetypeId];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl">
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

      {/* Score breakdown */}
      <div>
        <h2 className="mb-4 font-serif text-xl font-medium text-brand-deep-green">
          Your Score Breakdown
        </h2>
        <ArchetypeScoreBars scores={quizResult.scores} />
      </div>

      {/* Retake quiz */}
      <div className="rounded-xl border border-brand-gold/30 bg-brand-gold/5 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Feel like your spirit has shifted? You can always retake the quiz.
        </p>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/quiz">Retake Quiz</Link>
        </Button>
      </div>
    </div>
  );
}
