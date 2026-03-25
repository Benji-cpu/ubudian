import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { ShareButtons } from "@/components/blog/share-buttons";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { StoryCard } from "@/components/stories/story-card";
import { Badge } from "@/components/ui/badge";
import { StoryJsonLd } from "@/components/stories/story-json-ld";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth";
import { isInsider } from "@/lib/stripe/subscription";
import { MembersOnlyPaywall } from "@/components/membership/members-only-paywall";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Story } from "@/types";

interface StoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: story } = await supabase
      .from("stories")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!story) {
      return { title: "Story Not Found | The Ubudian" };
    }

    const s = story as Story;

    return {
      title: s.meta_title || `${s.subject_name} — Humans of Ubud | The Ubudian`,
      description: s.meta_description || s.subject_tagline || undefined,
      openGraph: {
        title: s.meta_title || `${s.subject_name} — Humans of Ubud`,
        description: s.meta_description || s.subject_tagline || undefined,
        images: s.photo_urls?.[0] ? [s.photo_urls[0]] : undefined,
        type: "article",
        publishedTime: s.published_at || undefined,
      },
    };
  } catch {
    return { title: "Story Not Found | The Ubudian" };
  }
}

export default async function StoryPage({ params }: StoryPageProps) {
  let s: Story;
  let related: Story[] = [];
  let showPaywall = false;

  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: story } = await supabase
      .from("stories")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!story) {
      notFound();
    }

    s = story as Story;

    // Check members-only gating
    if (s.is_members_only) {
      const user = await getCurrentUser();
      const insider = user ? await isInsider(user.id) : false;
      const admin = user ? (await getCurrentProfile())?.role === "admin" : false;
      if (!insider && !admin) showPaywall = true;
    }

    const { data: relatedStories, error: relatedError } = await supabase
      .from("stories")
      .select("*")
      .eq("status", "published")
      .neq("id", s.id)
      .order("published_at", { ascending: false })
      .limit(3);

    if (relatedError) console.error("Related stories query error:", relatedError);
    related = (relatedStories ?? []) as Story[];
  } catch {
    notFound();
  }

  const storyUrl = `${SITE_URL}/stories/${s.slug}`;

  return (
    <article>
      <StoryJsonLd story={s} />
      {/* Lead Photo */}
      {s.photo_urls?.[0] && (
        <div className="relative h-[540px] w-full">
          <Image
            src={s.photo_urls[0]}
            alt={s.subject_name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/stories">Humans of Ubud</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{s.subject_name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </nav>

      {/* Header */}
      <header className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-brand-deep-green sm:text-4xl lg:text-5xl">
          {s.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-lg font-medium text-brand-charcoal">
            {s.subject_name}
          </span>
          {s.subject_instagram && (
            <a
              href={`https://instagram.com/${s.subject_instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {s.subject_instagram.startsWith("@") ? s.subject_instagram : `@${s.subject_instagram}`}
            </a>
          )}
        </div>
        {s.subject_tagline && (
          <p className="mt-2 text-lg italic text-muted-foreground">
            {s.subject_tagline}
          </p>
        )}
        {s.theme_tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {s.theme_tags.map((tag) => (
              <Link key={tag} href={`/stories?theme=${encodeURIComponent(tag)}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Narrative */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {showPaywall ? <MembersOnlyPaywall /> : <MarkdownContent content={s.narrative} />}
      </div>

      {/* Additional Photos Gallery */}
      {s.photo_urls?.length > 1 && (
        <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.photo_urls.slice(1).map((url, i) => (
              <div key={url} className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                <Image
                  src={url}
                  alt={`${s.subject_name} photo ${i + 2}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Share Buttons */}
      <div className="mx-auto max-w-3xl border-t px-4 py-8 sm:px-6">
        <ShareButtons title={`${s.subject_name} — Humans of Ubud`} url={storyUrl} />
      </div>

      {/* Newsletter CTA */}
      <section className="bg-brand-pale-green px-4 py-14">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            Want more stories like this?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Get Humans of Ubud stories delivered to your inbox weekly.
          </p>
          <NewsletterSignup className="mx-auto mt-6 max-w-md" />
        </div>
      </section>

      {/* Related Stories */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            More Humans of Ubud
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((relatedStory) => (
              <StoryCard key={relatedStory.id} story={relatedStory} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
