interface EventsHeroProps {
  totalCount?: number;
}

/**
 * Compact masthead for `/events`. Deliberately short — a title and one line —
 * so the first event rows sit just below the fold instead of behind a
 * full-height portal. Was a `<PageHero variant="deep-green">` (100dvh, CTAs,
 * footnotes); trimmed per user feedback that the agenda should be reachable
 * without wading through copy.
 *
 * IMPORTANT: uses **literal hex** (#2C4A3E / #FAF5EC), not the
 * `--brand-deep-green` / `--brand-cream` tokens — those invert in `.dark` and
 * would turn this band into sage-on-charcoal. Gold (`brand-gold`) does not
 * invert. See memory `project_brand_var_inversion_on_locked_hero.md`.
 */
export function EventsHero({ totalCount }: EventsHeroProps) {
  const hasCount = typeof totalCount === "number" && totalCount > 0;

  return (
    <section className="relative overflow-hidden border-b border-brand-gold/15 bg-[#2C4A3E] py-5 dark:bg-[#0D1A14] sm:py-10">
      <BotanicalSvg id="events-hero-botanical" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-normal tracking-wide text-brand-gold sm:text-4xl">
          What&apos;s happening <span className="italic">in Ubud</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#FAF5EC]/80 sm:text-base">
          The pulse of the valley
          {hasCount ? ` — ${totalCount} gatherings on the agenda right now.` : "."}
        </p>
      </div>
    </section>
  );
}

function BotanicalSvg({ id }: { id: string }) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={id} x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <circle cx="60" cy="60" r="40" fill="none" stroke="#F0EAD6" strokeWidth="0.5" />
          <circle cx="60" cy="60" r="20" fill="none" stroke="#F0EAD6" strokeWidth="0.5" />
          <line x1="60" y1="20" x2="60" y2="100" stroke="#F0EAD6" strokeWidth="0.3" />
          <line x1="20" y1="60" x2="100" y2="60" stroke="#F0EAD6" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
