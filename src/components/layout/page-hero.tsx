import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  variant: "deep-green" | "cream";
  /**
   * Short uppercase orientation text rendered above the h1. On the
   * deep-green variant it sits between two short gold lines (e.g.
   * "UBUD · THIS WEEK AND BEYOND"). On the cream variant the kicker is
   * unusual — cream heroes default to a single short gold divider line
   * above the h1.
   */
  kicker?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Optional second paragraph below the subtitle (longer, smaller). */
  body?: ReactNode;
  /** Optional CTA stack — buttons + secondary links. */
  actions?: ReactNode;
  /** Optional footnote link rail below the actions (deep-green only by convention). */
  footnote?: ReactNode;
  /** Show the pulsing gold scroll dot at the bottom (full-height heroes only). */
  showScrollDot?: boolean;
  /** Hard escape hatch for extra section classes. */
  className?: string;
};

/**
 * Shared shell for every public list-page hero. Two variants:
 *
 * - `deep-green`: full-height (`min-h-[100dvh]`) literal-hex gradient,
 *   botanical SVG overlay, gold serif h1, cream subtitle, optional
 *   pulsing scroll dot. Applies `-mt-14` internally so the gradient
 *   bleeds under the fixed `h-14` header (see
 *   `src/components/layout/header.tsx:23`).
 *
 *   IMPORTANT: this variant uses **literal hex** (#2C4A3E, #FAF5EC etc)
 *   not the `--brand-cream` / `--brand-deep-green` tokens — they invert
 *   in `.dark` and break locked-dark heroes. See memory
 *   `project_brand_var_inversion_on_locked_hero.md`.
 *
 * - `cream`: standard `py-16 sm:py-20`, `bg-brand-cream` shell, single
 *   gold divider line above a deep-green serif h1, muted subtitle.
 */
export function PageHero({
  variant,
  kicker,
  title,
  subtitle,
  body,
  actions,
  footnote,
  showScrollDot,
  className,
}: PageHeroProps) {
  if (variant === "deep-green") {
    return (
      <div className="-mt-14">
        <section
          className={cn(
            "relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-b from-[#2C4A3E] via-[#3A5F50] to-[#8BAF8A] dark:from-[#0D1A14] dark:via-[#152820] dark:to-[#1A2A22]",
            className,
          )}
        >
          <BotanicalSvg id="page-hero-botanical-dg" />

          <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
            {kicker ? (
              <div className="mx-auto mb-7 flex items-center justify-center gap-3">
                <span className="h-px w-10 bg-brand-gold/50" />
                <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-brand-gold/80">
                  {kicker}
                </span>
                <span className="h-px w-10 bg-brand-gold/50" />
              </div>
            ) : null}

            <h1 className="font-serif text-5xl font-normal tracking-wide text-brand-gold sm:text-6xl lg:text-7xl">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-6 font-serif text-xl italic text-[#FAF5EC] sm:text-2xl">
                {subtitle}
              </p>
            ) : null}

            {body ? (
              <p className="mx-auto mt-4 max-w-lg text-base text-[#FAF5EC]/80">
                {body}
              </p>
            ) : null}

            {actions ? (
              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                {actions}
              </div>
            ) : null}

            {footnote ? (
              <div className="mt-10 flex items-center justify-center gap-4 text-xs text-brand-off-white/60">
                {footnote}
              </div>
            ) : null}
          </div>

          {showScrollDot ? (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
              <div className="animate-pulse-down h-3 w-3 rounded-full bg-brand-gold" />
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  // cream
  return (
    <section
      className={cn(
        "bg-brand-cream px-4 py-16 sm:py-20",
        className,
      )}
    >
      <div className="mx-auto max-w-3xl text-center">
        {kicker ? (
          <div className="mx-auto mb-6 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-brand-gold/50" />
            <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-brand-gold/80">
              {kicker}
            </span>
            <span className="h-px w-10 bg-brand-gold/50" />
          </div>
        ) : (
          <div className="mx-auto mb-6 h-px w-12 bg-brand-gold/40" />
        )}

        <h1 className="font-serif text-4xl font-medium tracking-tight text-brand-deep-green dark:text-brand-off-white sm:text-5xl">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
        ) : null}

        {body ? (
          <div className="mt-4 text-lg text-muted-foreground">{body}</div>
        ) : null}

        {actions ? <div className="mt-6">{actions}</div> : null}
      </div>
    </section>
  );
}

function BotanicalSvg({ id }: { id: string }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-5"
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
