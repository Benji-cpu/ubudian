import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { TourCard } from "@/components/tours/tour-card";
import type { Tour } from "@/types";

export async function FeaturedTours() {
  let tours: Tour[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await queryWithRetry(
      () =>
        supabase
          .from("tours")
          .select("*")
          .eq("is_active", true)
          .limit(3),
      "homepage-tours"
    );

    if (error) console.error("Homepage tours query error:", error);
    tours = (data ?? []) as Tour[];
  } catch {
    // Supabase unreachable
  }

  if (tours.length > 0) {
    return (
      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    );
  }

  return null;
}
