import { EventCardSkeleton } from "@/components/skeletons/event-card-skeleton";

export default function EventsLoading() {
  return (
    <div>
      <section className="bg-brand-cream px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-12 bg-brand-gold/40" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-brand-deep-green sm:text-5xl">
            What&apos;s Happening in Ubud
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            From yoga workshops to live music, art exhibitions, and community
            gatherings — discover the heartbeat of Ubud.
          </p>
        </div>
      </section>
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
