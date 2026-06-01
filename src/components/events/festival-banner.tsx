"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";

interface FestivalBannerProps {
  href: string;
  /** Relative-time eyebrow, e.g. "Opens Friday" / "On now · last day". */
  eyebrow: string;
  title: string;
  line?: string | null;
  /** sessionStorage key so a dismissal sticks for the rest of the visit. */
  dismissKey: string;
}

/**
 * The single floating moment-banner above the events feed — the one element
 * allowed to breach the core/discovery wall. Appears only when a spotlight
 * festival or market is imminent; dismissible for the session. Brand register:
 * slim, editorial, deep-green + gold — never a promo bar.
 */
export function FestivalBanner({
  href,
  eyebrow,
  title,
  line,
  dismissKey,
}: FestivalBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(dismissKey) === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
  }, [dismissKey]);

  if (dismissed) return null;

  function dismiss() {
    try {
      window.sessionStorage.setItem(dismissKey, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-brand-gold/30 bg-brand-deep-green px-4 py-3 shadow-[0_14px_30px_-20px_rgba(44,74,62,0.6)] sm:px-5">
        {/* Soft gold wash on the right edge for depth */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-brand-gold/15 to-transparent"
        />

        <Link
          href={href}
          className="group relative flex min-w-0 flex-1 items-center gap-3 sm:gap-4"
        >
          <span
            aria-hidden
            className="hidden h-9 w-px shrink-0 bg-brand-gold/50 sm:block"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">
              {eyebrow}
            </span>
            <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-serif text-base font-medium leading-snug text-brand-cream break-words sm:text-lg">
                {title}
              </span>
              {line && (
                <span className="text-sm text-brand-cream/70 break-words line-clamp-1">
                  — {line}
                </span>
              )}
            </span>
          </span>
          <ArrowRight className="hidden h-5 w-5 shrink-0 text-brand-gold transition-transform duration-300 group-hover:translate-x-1 sm:block" />
        </Link>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="relative z-10 shrink-0 rounded-full p-1.5 text-brand-cream/60 transition-colors hover:bg-brand-cream/10 hover:text-brand-cream"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
