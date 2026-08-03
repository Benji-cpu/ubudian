import { EditionCardSkeleton } from "@/components/skeletons/edition-card-skeleton";
import { PageHero } from "@/components/layout/page-hero";

export default function NewsletterLoading() {
  return (
    <div>
      <PageHero
        variant="cream"
        title="The Ubudian Newsletter"
        subtitle="One email a week with the ceremonies, workshops, sound journeys, community stories, and conversations that matter in Ubud right now."
      />
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
