import { TourCardSkeleton } from "@/components/skeletons/tour-card-skeleton";

export default function ToursLoading() {
  return (
    <div>
      <section className="bg-brand-cream px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-12 bg-brand-gold/40" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-brand-deep-green sm:text-5xl">
            Walk the Land
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Rice terraces, sacred water temples, jungle waterfalls, and food trails
            through the warungs and markets — with guides who live here and love this place.
          </p>
        </div>
      </section>
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
