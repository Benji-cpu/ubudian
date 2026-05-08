import { GrainTexture } from "@/components/ui/grain-texture";
import type { JourneyTestimonial } from "@/types";

interface JourneyTestimonialsProps {
  testimonials: JourneyTestimonial[];
  journeyTitle: string;
}

/**
 * Three-up grid of testimonials on desktop, stacked on mobile. Each card
 * carries a large Lora quote-mark flourish, a film-grain avatar, and a
 * soft hover lift. Initials tile (gold-on-deep-green) renders when no
 * avatar_url — we never generate fake faces.
 */
export function JourneyTestimonials({ testimonials, journeyTitle }: JourneyTestimonialsProps) {
  if (testimonials.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-t border-brand-gold/15 bg-brand-cream/45 px-4 py-16 sm:px-6 sm:py-20">
      <GrainTexture opacity={0.04} />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-brand-gold">
            From past travellers
          </span>
          <h2 className="mt-3 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
            What people carry home
          </h2>
        </div>
        <ul className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <li
              key={t.id}
              className="group relative flex flex-col rounded-md border border-brand-gold/20 bg-card p-6 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-brand-gold/40 hover:shadow-[0_8px_28px_-12px_rgba(44,74,62,0.18)]"
            >
              {/* Lora quote-mark flourish — lives behind the quote, soft */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-1 left-4 select-none font-serif text-[5rem] leading-none text-brand-gold/30 sm:text-[6rem]"
              >
                &ldquo;
              </span>
              <blockquote className="relative flex-1 pt-7 font-serif text-base italic leading-relaxed text-foreground/85">
                {t.quote}
              </blockquote>
              <div className="mt-5 flex items-center gap-3 border-t border-brand-gold/15 pt-4">
                <Avatar
                  name={t.attendee_name}
                  url={t.avatar_url}
                  alt={`${t.attendee_name} — ${journeyTitle}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-deep-green">{t.attendee_name}</p>
                  <p className="text-xs text-foreground/55">
                    {[t.attendee_origin, t.journey_day_referenced ? `Day ${t.journey_day_referenced}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Avatar({ name, url, alt }: { name: string; url: string | null; alt: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={alt}
        className="h-11 w-11 shrink-0 rounded-full border border-brand-gold/30 object-cover"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-gold/25 bg-brand-deep-green font-serif text-sm font-medium text-brand-gold"
      aria-label={alt}
    >
      <GrainTexture opacity={0.18} />
      <span className="relative">{initials}</span>
    </span>
  );
}
