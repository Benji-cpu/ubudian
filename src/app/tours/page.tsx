import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TourCard } from "@/components/tours/tour-card";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import type { Tour } from "@/types";

export const metadata: Metadata = {
  title: "Secret Tours | The Ubudian",
  description:
    "Curated experiences beyond the tourist trail — rice terraces, temples, food tours, and hidden gems with local guides.",
};

export default async function ToursPage() {
  let allTours: Tour[] = [];

  try {
    const supabase = await createClient();

    const { data: tours, error } = await supabase
      .from("tours")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) console.error("Tours query error:", error);
    allTours = (tours ?? []) as Tour[];
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
            The Ubudian Secret Tours
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Curated experiences beyond the tourist trail — rice terraces, temples,
            food tours, and hidden gems with local guides who know Ubud inside out.
          </p>
        </div>
      </section>

      {/* Tours Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {allTours.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              Tours are coming soon! Check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {allTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="bg-brand-pale-green px-4 py-14">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            Get notified about new tours
          </h2>
          <p className="mt-2 text-muted-foreground">
            Subscribe to The Ubudian and be the first to know about new experiences.
          </p>
          <NewsletterSignup className="mx-auto mt-6 max-w-md" />
        </div>
      </section>
    </div>
  );
}
