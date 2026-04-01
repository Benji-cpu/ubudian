import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { Button } from "@/components/ui/button";
import type { Experience } from "@/types";

export const metadata: Metadata = {
  title: "Ubud Experiences | The Ubudian",
  description:
    "Embodiment workshops, cacao ceremonies, tantric temples, sound journeys — the practices that define life in Ubud.",
};

export default async function ExperiencesPage() {
  let allExperiences: Experience[] = [];

  try {
    const supabase = await createClient();

    const { data: experiences, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) console.error("Experiences query error:", error);
    allExperiences = (experiences ?? []) as Experience[];
  } catch {
    // Supabase unreachable — render with empty state
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-cream px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-12 bg-brand-gold/40" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-brand-deep-green sm:text-5xl">
            Ubud Experiences
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Embodiment workshops, cacao ceremonies, tantric temples, sound
            journeys — the practices that define life in Ubud, matched to your archetype.
          </p>
        </div>
      </section>

      {/* Experiences Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {allExperiences.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              Experiences are coming soon! Check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {allExperiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        )}
      </section>

      {/* Quiz CTA */}
      <section className="bg-brand-pale-green px-4 py-14">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            Not sure where to start?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Take the quiz to find your archetype — and see which experiences have your name on them.
          </p>
          <Button asChild className="mt-6">
            <Link href="/quiz">Take the Quiz</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
