import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

interface CrossSectionRibbonProps {
  /** Short pitch line, e.g. "Looking for a packaged path?" */
  pitch?: string;
  /** Where to send users — defaults to /experiences (the journeys index). */
  href?: string;
  /** Link label. */
  cta?: string;
}

/**
 * A quiet horizontal banner used on /events, /stories, /tours to surface the
 * Journeys feature without dominating the page. Brand-warm, single-line on
 * mobile, comfortable on desktop.
 */
export function CrossSectionRibbon({
  pitch = "Looking for a packaged path through Ubud?",
  href = "/experiences",
  cta = "See the curated retreats",
}: CrossSectionRibbonProps) {
  return (
    <section className="border-y border-brand-gold/20 bg-brand-cream/60 px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-brand-deep-green">
          <Compass className="h-4 w-4 shrink-0 text-brand-gold" />
          <span>{pitch}</span>
        </p>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-deep-green underline-offset-4 hover:underline"
        >
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
