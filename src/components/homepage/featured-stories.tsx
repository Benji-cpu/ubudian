import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { StoryCard } from "@/components/stories/story-card";
import type { Story } from "@/types";

export async function FeaturedStories() {
  let stories: Story[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await queryWithRetry(
      () =>
        supabase
          .from("stories")
          .select("*")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(3),
      "homepage-stories"
    );

    if (error) console.error("Homepage stories query error:", error);
    stories = (data ?? []) as Story[];
  } catch {
    // Supabase unreachable
  }

  if (stories.length > 0) {
    return (
      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto mt-12 grid max-w-4xl items-center gap-12 md:grid-cols-2">
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="relative h-80 w-64 overflow-hidden rounded-[40%_60%_55%_45%/50%_40%_60%_50%]">
          <Image
            src="https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?w=600&h=800&fit=crop"
            alt="Bali artisan"
            fill
            className="object-cover"
            sizes="256px"
          />
        </div>
      </div>
      <div>
        <p className="text-lg leading-relaxed text-brand-charcoal-light">
          The healers, ceremonialists, farmers, and seekers who call Ubud
          home — their stories are on the way.
        </p>
      </div>
    </div>
  );
}
