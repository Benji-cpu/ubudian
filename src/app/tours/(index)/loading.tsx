import { TourCardSkeleton } from "@/components/skeletons/tour-card-skeleton";
import { PageHero } from "@/components/layout/page-hero";

export default function ToursLoading() {
  return (
    <div>
      <PageHero
        variant="cream"
        title="Walk the Land"
        subtitle="Rice terraces, sacred water temples, jungle waterfalls, and food trails through the warungs and markets — with guides who live here and love this place."
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <TourCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
