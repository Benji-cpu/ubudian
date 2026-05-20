import { PostCardSkeleton } from "@/components/skeletons/post-card-skeleton";
import { PageHero } from "@/components/layout/page-hero";

export default function BlogLoading() {
  return (
    <div>
      <PageHero
        variant="cream"
        title="Blog"
        subtitle={
          <>
            The eat-pray-love reality, the spiritual circus, and honest takes
            on life in Ubud&apos;s conscious scene.
          </>
        }
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
