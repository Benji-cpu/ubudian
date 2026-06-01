import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface FestivalBannerProps {
  href: string;
  /** Relative-time eyebrow, e.g. "Opens Friday" / "On now · last day". */
  eyebrow: string;
  title: string;
  line?: string | null;
}

/**
 * The single quiet highlight strip above the events feed — the one element
 * allowed to breach the core/discovery wall. Appears only when a spotlight
 * festival or one-off is imminent. Non-dismissible by design (it's a curated
 * highlight, not a promo interruption).
 *
 * IMPORTANT: uses **literal hex** (#2C4A3E / #FAF5EC), not the
 * `--brand-deep-green` / `--brand-cream` tokens — those invert in `.dark`
 * (deep-green → sage, cream → charcoal) and made this render as illegible
 * dark-on-sage. Gold (`brand-gold`) does not invert, so the eyebrow stays
 * legible on the locked green. See `project_brand_var_inversion_on_locked_hero`.
 */
export function FestivalBanner({ href, eyebrow, title, line }: FestivalBannerProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Link
        href={href}
        className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-brand-gold/30 bg-[#2C4A3E] px-4 py-3 transition-colors hover:border-brand-gold/50 dark:bg-[#1A2A22] sm:gap-4 sm:px-5"
      >
        <span
          aria-hidden
          className="hidden h-9 w-px shrink-0 bg-brand-gold/40 sm:block"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4BB7F]">
            {eyebrow}
          </span>
          <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-serif text-base font-medium leading-snug text-[#FAF5EC] break-words sm:text-lg">
              {title}
            </span>
            {line && (
              <span className="text-sm text-[#FAF5EC]/70 break-words line-clamp-1">
                — {line}
              </span>
            )}
          </span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 text-brand-gold transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
