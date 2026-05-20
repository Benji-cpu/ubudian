import { EventCardSkeleton } from "@/components/skeletons/event-card-skeleton";
import { PageHero } from "@/components/layout/page-hero";

export default function EventsLoading() {
  return (
    <div>
      <PageHero
        variant="deep-green"
        kicker="Ubud · This week and beyond"
        title={
          <>
            What&apos;s happening <span className="italic">in Ubud.</span>
          </>
        }
        subtitle="The pulse of the valley, gathered daily."
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
