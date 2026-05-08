import { CATEGORY_BRAND_GRADIENTS } from "@/lib/constants";

interface EventCardPlaceholderProps {
  category: string;
  className?: string;
}

const GRAIN_DATA_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.36 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Editorial fallback for cards with no cover image.
 *
 * Register: museum / Aman / National Geographic — never new-age. Brand
 * gradient + hairline rule + serif small-caps category, layered film grain
 * for tactile depth. No mandalas, no rings, no decorative scrolls.
 */
export function EventCardPlaceholder({
  category,
  className = "",
}: EventCardPlaceholderProps) {
  const gradient =
    CATEGORY_BRAND_GRADIENTS[category] || CATEGORY_BRAND_GRADIENTS["Other"];

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} ${className}`}
    >
      {/* Vignette for depth */}
      <span
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_55%,rgba(0,0,0,0.45)_100%)]"
      />
      {/* Film grain */}
      <span
        aria-hidden
        className="absolute inset-0 mix-blend-overlay opacity-40"
        style={{ backgroundImage: GRAIN_DATA_URL, backgroundRepeat: "repeat" }}
      />

      {/* Editorial typography lockup */}
      <div className="relative z-10 flex flex-col items-center px-3 text-center">
        <span
          aria-hidden
          className="mb-2 h-px w-7 bg-brand-gold/55 sm:w-10"
        />
        <span className="font-serif text-[10px] font-medium uppercase leading-tight tracking-[0.22em] text-brand-cream/85 sm:text-[11px]">
          {category}
        </span>
        <span
          aria-hidden
          className="mt-2 h-px w-7 bg-brand-gold/55 sm:w-10"
        />
      </div>
    </div>
  );
}
