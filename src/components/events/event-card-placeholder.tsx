import { CATEGORY_BRAND_GRADIENTS } from "@/lib/constants";

interface EventCardPlaceholderProps {
  category: string;
  className?: string;
}

/**
 * Branded fallback shown on event cards that have no cover image.
 *
 * Replaces the old single-emoji-on-gradient treatment with a quieter
 * deep-green / terracotta / gold composition: category-tinted gradient,
 * a subtle concentric-ring ornament, and the category name typeset in
 * small-caps serif. Meant to sit comfortably next to real photography.
 */
export function EventCardPlaceholder({ category, className = "" }: EventCardPlaceholderProps) {
  const gradient =
    CATEGORY_BRAND_GRADIENTS[category] || CATEGORY_BRAND_GRADIENTS["Other"];

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} ${className}`}
    >
      <RingOrnament />
      <div className="relative z-10 flex flex-col items-center px-3 text-center">
        <span className="font-serif text-[10px] uppercase leading-tight tracking-[0.18em] text-brand-gold/90 sm:text-xs">
          {category}
        </span>
        <span
          aria-hidden
          className="mt-1.5 h-px w-6 bg-brand-gold/50 sm:w-8"
        />
      </div>
    </div>
  );
}

/** Decorative concentric rings, bottom-right, very faint — evokes ceremony. */
function RingOrnament() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="xMaxYMax meet"
      className="absolute -right-6 -bottom-8 h-36 w-36 text-brand-gold opacity-[0.12]"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.6">
        <circle cx="50" cy="50" r="14" />
        <circle cx="50" cy="50" r="22" />
        <circle cx="50" cy="50" r="30" />
        <circle cx="50" cy="50" r="38" />
        <circle cx="50" cy="50" r="46" />
      </g>
    </svg>
  );
}
