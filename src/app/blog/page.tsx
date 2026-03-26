import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { PostCard } from "@/components/blog/post-card";
import type { BlogPost } from "@/types";

export const metadata: Metadata = {
  title: "Blog | The Ubudian",
  description:
    "Writing from the heart of Ubud's conscious community — expat realities, cultural reflections, and the conversations we're all having.",
};

export default async function BlogPage() {
  let blogPosts: BlogPost[] = [];

  try {
    const supabase = await createClient();

    const { data: posts, error } = await queryWithRetry(
      () =>
        supabase
          .from("blog_posts")
          .select("*")
          .eq("status", "published")
          .order("published_at", { ascending: false }),
      "blog-list"
    );

    if (error) console.error("Blog posts query error:", error);
    blogPosts = (posts ?? []) as BlogPost[];
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
            Blog
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Writing from the community — expat realities, cultural reflections,
            and honest takes on life in Ubud&apos;s conscious scene.
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {blogPosts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              No posts published yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {blogPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
