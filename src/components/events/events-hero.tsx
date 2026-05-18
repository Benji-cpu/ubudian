import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EventsHeroProps {
  totalCount?: number;
}

/**
 * Full-height portal hero, twinned with the home-page canopy
 * (`src/app/page.tsx:93–157`). Same deep-green-to-sage gradient, same
 * botanical SVG overlay, same Lora gold headline + cream subtitle, same
 * gold-CTA-plus-italic-secondary stack, same pulsing scroll dot — so
 * /events stops feeling like a different brand from /.
 *
 * Parent should wrap in `-mt-14` so the gradient bleeds up under the
 * fixed header for the same colour-match-with-nav effect the home uses.
 */
export function EventsHero({ totalCount }: EventsHeroProps) {
  const hasCount = typeof totalCount === "number" && totalCount > 0;

  return (
    <section
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-b from-[#2C4A3E] via-[#3A5F50] to-[#8BAF8A] dark:from-[#0D1A14] dark:via-[#152820] dark:to-[#1A2A22]"
      aria-label="Events in Ubud"
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="events-hero-botanical"
            x="0"
            y="0"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="60" cy="60" r="40" fill="none" stroke="#F0EAD6" strokeWidth="0.5" />
            <circle cx="60" cy="60" r="20" fill="none" stroke="#F0EAD6" strokeWidth="0.5" />
            <line x1="60" y1="20" x2="60" y2="100" stroke="#F0EAD6" strokeWidth="0.3" />
            <line x1="20" y1="60" x2="100" y2="60" stroke="#F0EAD6" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#events-hero-botanical)" />
      </svg>

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <div className="mx-auto mb-7 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-brand-gold/50" />
          <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-brand-gold/80">
            Ubud · This week and beyond
          </span>
          <span className="h-px w-10 bg-brand-gold/50" />
        </div>

        <h1 className="font-serif text-5xl font-normal tracking-wide text-brand-gold sm:text-6xl lg:text-7xl">
          What&apos;s happening{" "}
          <span className="italic">in Ubud.</span>
        </h1>

        <p className="mt-6 font-serif text-xl italic text-brand-cream sm:text-2xl">
          The pulse of the valley, gathered daily.
        </p>

        <p className="mx-auto mt-4 max-w-lg text-base text-brand-off-white/80">
          Sound journeys, tantra evenings, ecstatic dance, breathwork,
          ceremony, and the deep-conversation circles in between —{" "}
          {hasCount
            ? `${totalCount} gatherings on right now.`
            : "drawn from across the valley."}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-brand-gold text-brand-deep-green hover:bg-brand-gold/90 dark:bg-brand-gold dark:text-brand-deep-green dark:hover:bg-brand-gold/90"
          >
            <Link href="#events">Browse the agenda &rarr;</Link>
          </Button>
          <Link
            href="/experiences"
            className="font-serif text-sm italic text-brand-cream/90 underline decoration-brand-cream/30 underline-offset-4 transition-colors hover:text-brand-gold hover:decoration-brand-gold/60"
          >
            Or see the curated multi-day retreats
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4 text-xs text-brand-off-white/60">
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
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="animate-pulse-down h-3 w-3 rounded-full bg-brand-gold" />
      </div>
    </section>
  );
}
