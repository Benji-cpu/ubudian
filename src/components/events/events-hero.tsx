import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";

interface EventsHeroProps {
  totalCount?: number;
}

/**
 * Full-height portal hero for `/events`, twinned with the home-page
 * canopy (`src/app/page.tsx`). Both render via the shared `<PageHero
 * variant="deep-green">` shell, so any future tweak (gradient stops,
 * botanical pattern, scroll-dot animation) lands in one file.
 *
 * The wrapping component still owns the dynamic count copy + event-page
 * specific footnote links; everything below is layout.
 */
export function EventsHero({ totalCount }: EventsHeroProps) {
  const hasCount = typeof totalCount === "number" && totalCount > 0;

  return (
    <PageHero
      variant="deep-green"
      kicker="Ubud · This week and beyond"
      title={
        <>
          What&apos;s happening <span className="italic">in Ubud.</span>
        </>
      }
      subtitle="The pulse of the valley, gathered daily."
      body={
        <>
          Sound journeys, tantra evenings, ecstatic dance, breathwork,
          ceremony, and the deep-conversation circles in between —{" "}
          {hasCount
            ? `${totalCount} gatherings on the agenda right now.`
            : "drawn from across the valley."}
        </>
      }
      actions={
        <>
          <Button
            asChild
            size="lg"
            className="bg-brand-gold text-[#2C4A3E] hover:bg-brand-gold/90 dark:bg-brand-gold dark:text-[#2C4A3E] dark:hover:bg-brand-gold/90"
          >
            <Link href="#events">Browse the agenda &rarr;</Link>
          </Button>
          <Link
            href="/experiences"
            className="font-serif text-sm italic text-[#FAF5EC]/90 underline decoration-[#FAF5EC]/30 underline-offset-4 transition-colors hover:text-brand-gold hover:decoration-brand-gold/60"
          >
            Or see the curated multi-day retreats
          </Link>
        </>
      }
      footnote={
        <>
          <Link
            href="/quiz"
            className="font-serif italic underline decoration-brand-off-white/20 underline-offset-4 transition-colors hover:text-brand-gold hover:decoration-brand-gold/60"
          >
            Take the 6-question quiz
          </Link>
          <span aria-hidden className="h-3 w-px bg-brand-off-white/20" />
          <Link
            href="/events/submit"
            className="font-serif italic underline decoration-brand-off-white/20 underline-offset-4 transition-colors hover:text-brand-gold hover:decoration-brand-gold/60"
          >
            Submit an event
          </Link>
        </>
      }
      showScrollDot
    />
  );
}
