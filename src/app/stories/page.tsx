import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { StoryCard } from "@/components/stories/story-card";
import { ThemeFilter } from "@/components/stories/theme-filter";
import type { Story } from "@/types";

export const metadata: Metadata = {
  title: "Humans of Ubud | The Ubudian",
  description:
    "Meet the people who make Ubud special — locals, expats, artists, healers, and entrepreneurs sharing their stories.",
};

interface StoriesPageProps {
  searchParams: Promise<{ theme?: string }>;
}

export default async function StoriesPage({ searchParams }: StoriesPageProps) {
  const { theme } = await searchParams;

  let allStories: Story[] = [];

  try {
    const supabase = await createClient();

    const { data: stories, error } = await queryWithRetry(() => {
      let query = supabase
        .from("stories")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (theme) {
        query = query.contains("theme_tags", [theme]);
      }

      return query;
    }, "stories-list");
    if (error) console.error("Stories query error:", error);
    allStories = (stories ?? []) as Story[];
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
            Humans of Ubud
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Meet the people who make Ubud special — locals, expats, artists,
            healers, and entrepreneurs sharing their stories.
          </p>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Suspense>
          <ThemeFilter />
        </Suspense>

        <div className="mt-8">
          {allStories.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg text-muted-foreground">
                {theme
                  ? `No stories found with the "${theme}" theme. Try a different filter.`
                  : "No stories published yet. Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {allStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
