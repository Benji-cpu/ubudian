import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { JourneyCard } from "@/components/journeys/journey-card";
import type { Journey } from "@/types";

export async function FeaturedJourneys() {
  let journeys: Journey[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await queryWithRetry(
      () =>
        supabase
          .from("journeys")
          .select("*")
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
          .limit(3),
      "homepage-journeys"
    );

    if (error) console.error("Homepage journeys query error:", error);
    journeys = (data ?? []) as Journey[];
  } catch {
    // Supabase unreachable — render nothing rather than crash the homepage.
  }

  if (journeys.length === 0) return null;

  return (
    <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {journeys.map((journey) => (
        <JourneyCard key={journey.id} journey={journey} />
      ))}
    </div>
  );
}
