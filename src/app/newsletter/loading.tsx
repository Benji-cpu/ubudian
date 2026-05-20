import { EditionCardSkeleton } from "@/components/skeletons/edition-card-skeleton";

export default function NewsletterLoading() {
  return (
    <div>
      <section className="bg-brand-cream px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-12 bg-brand-gold/40" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-brand-deep-green sm:text-5xl">
            The Ubudian Newsletter
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            One email a week with the ceremonies, workshops, sound journeys,
            community stories, and conversations that matter in Ubud right now.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
          Past Editions
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <EditionCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
