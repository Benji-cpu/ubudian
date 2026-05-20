import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TourCard } from "@/components/tours/tour-card";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { PageHero } from "@/components/layout/page-hero";
import { CrossSectionRibbon } from "@/components/journeys/cross-section-ribbon";
import { getSiteSettings } from "@/lib/site-settings";
import type { Tour } from "@/types";

export const metadata: Metadata = {
  title: "Secret Tours | The Ubudian",
  description:
    "Walk the rice terraces, visit sacred water temples, trek through jungles, and eat your way through Ubud with local guides.",
};

export default async function ToursPage() {
  const settings = await getSiteSettings();
  if (!settings.tours_enabled) notFound();

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
      <PageHero
        variant="cream"
        title="Walk the Land"
        subtitle="Rice terraces, sacred water temples, jungle waterfalls, and food trails through the warungs and markets — with guides who live here and love this place."
      />

      <CrossSectionRibbon
        pitch="Tours are day-shaped. Looking for something multi-day?"
        cta="See the curated retreats"
      />

      {/* Tours Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {allTours.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              Tours are coming — subscribe to hear when they drop.
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
            Don&apos;t miss the next one
          </h2>
          <p className="mt-2 text-muted-foreground">
            Subscribe to The Ubudian and hear about new tours before they fill up.
          </p>
          <NewsletterSignup className="mx-auto mt-6 max-w-md" />
        </div>
      </section>
    </div>
  );
}
