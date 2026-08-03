import { StoryCardSkeleton } from "@/components/skeletons/story-card-skeleton";
import { PageHero } from "@/components/layout/page-hero";

export default function StoriesLoading() {
  return (
    <div>
      <PageHero
        variant="cream"
        title="Humans of Ubud"
        subtitle="Tantra facilitators, breathwork guides, ceremony holders, organic farmers — the humans who hold space in Ubud."
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
