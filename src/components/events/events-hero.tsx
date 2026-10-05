interface EventsHeroProps {
  totalCount?: number;
  /**
   * Render the title as a plain element instead of `<h1>`. The streaming
   * skeleton renders this same hero, and both copies end up in the raw HTML
   * that crawlers read — so the fallback must not also claim the page heading.
   */
  asHeading?: boolean;
}

/**
 * Compact masthead for `/events`. Deliberately short — a title and one line —
 * so the first event rows sit just below the fold instead of behind a
 * full-height portal. Was a `<PageHero variant="deep-green">` (100dvh, CTAs,
 * footnotes); trimmed per user feedback that the agenda should be reachable
 * without wading through copy.
 *
 * Light, plain-spoken since 5 Oct 2026 to match the "Ubud, today" home page:
 * venue owners and families land here, so no insider voice.
 */
export function EventsHero({ totalCount, asHeading = true }: EventsHeroProps) {
  const hasCount = typeof totalCount === "number" && totalCount > 0;
  const Title = asHeading ? "h1" : "div";

  return (
    <section className="border-b border-border bg-background py-5 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Title className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          What&apos;s on in Ubud
        </Title>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground sm:text-base">
          {hasCount
            ? `${totalCount} gatherings coming up: dance, sound, ceremony, workshops and more.`
            : "Dance, sound, ceremony, workshops and more, checked every night."}
        </p>
      </div>
    </section>
  );
}
