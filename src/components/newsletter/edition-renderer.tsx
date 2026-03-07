import Image from "next/image";
import { MarkdownContent } from "@/components/blog/markdown-content";
import type { NewsletterEdition } from "@/types";

interface EditionRendererProps {
  edition: NewsletterEdition;
}

export function EditionRenderer({ edition }: EditionRendererProps) {
  const content = (edition.content_json ?? {}) as Record<string, string>;

  return (
    <div className="space-y-10">
      {content.featured_story_excerpt && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            Featured Story
          </h2>
          <div className="mt-4">
            <MarkdownContent content={content.featured_story_excerpt} />
          </div>
        </section>
      )}

      {content.weekly_flow && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            What&apos;s Happening This Week
          </h2>
          <div className="mt-4">
            <MarkdownContent content={content.weekly_flow} />
          </div>
        </section>
      )}

      {content.community_bulletin && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            Community Bulletin
          </h2>
          <div className="mt-4">
            <MarkdownContent content={content.community_bulletin} />
          </div>
        </section>
      )}

      {content.cultural_moment && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            Cultural Moment
          </h2>
          <div className="mt-4">
            <MarkdownContent content={content.cultural_moment} />
          </div>
        </section>
      )}

      {content.weekly_question && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            Weekly Question
          </h2>
          <p className="mt-2 text-lg italic text-brand-charcoal-light">
            {content.weekly_question}
          </p>
          {content.weekly_question_responses && (
            <div className="mt-4">
              <MarkdownContent content={content.weekly_question_responses} />
            </div>
          )}
        </section>
      )}

      {content.tour_spotlight_text && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            Tour Spotlight
          </h2>
          <div className="mt-4">
            <MarkdownContent content={content.tour_spotlight_text} />
          </div>
        </section>
      )}

      {edition.sponsor_name && (
        <section className="rounded-md border bg-muted/50 p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Sponsored</p>
          <h3 className="mt-1 font-serif text-lg font-semibold">{edition.sponsor_name}</h3>
          {edition.sponsor_image_url && (
            <div className="relative mt-3 h-24 w-48">
              <Image
                src={edition.sponsor_image_url}
                alt={`${edition.sponsor_name} logo`}
                fill
                sizes="192px"
                className="rounded object-contain"
              />
            </div>
          )}
          {edition.sponsor_text && (
            <p className="mt-2 text-sm text-muted-foreground">{edition.sponsor_text}</p>
          )}
          {edition.sponsor_url && (
            <a
              href={edition.sponsor_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              Learn more
            </a>
          )}
        </section>
      )}
    </div>
  );
}
