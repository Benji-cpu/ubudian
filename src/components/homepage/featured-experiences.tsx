import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { ExperienceCard } from "@/components/experiences/experience-card";
import type { Experience } from "@/types";

export async function FeaturedExperiences() {
  let experiences: Experience[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await queryWithRetry(
      () =>
        supabase
          .from("experiences")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(3),
      "homepage-experiences"
    );

    if (error) console.error("Homepage experiences query error:", error);
    experiences = (data ?? []) as Experience[];
  } catch {
    // Supabase unreachable
  }

  if (experiences.length > 0) {
    return (
      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {experiences.map((experience) => (
          <ExperienceCard key={experience.id} experience={experience} />
        ))}
      </div>
    );
  }

  return null;
}
