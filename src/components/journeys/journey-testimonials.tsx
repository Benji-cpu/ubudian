import type { JourneyTestimonial } from "@/types";

interface JourneyTestimonialsProps {
  testimonials: JourneyTestimonial[];
  journeyTitle: string;
}

/**
 * Three-up grid of testimonials on desktop, stacked on mobile. Renders an
 * initials avatar tile (gold-on-deep-green) when avatar_url is null — we never
 * generate fake faces, that ages badly.
 */
export function JourneyTestimonials({ testimonials, journeyTitle }: JourneyTestimonialsProps) {
  if (testimonials.length === 0) return null;

  return (
    <section className="border-t bg-brand-cream/40 px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-gold">
            From past travellers
          </span>
          <h2 className="mt-2 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
            What people carry home
          </h2>
        </div>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <li
              key={t.id}
              className="flex flex-col rounded-md border border-brand-gold/20 bg-card p-5"
            >
              <blockquote className="flex-1 font-serif text-base italic leading-relaxed text-foreground/90">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-4 flex items-center gap-3 border-t border-brand-gold/15 pt-4">
                <Avatar
                  name={t.attendee_name}
                  url={t.avatar_url}
                  alt={`${t.attendee_name} — ${journeyTitle}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-deep-green">{t.attendee_name}</p>
                  <p className="text-xs text-muted-foreground">
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
        className="h-10 w-10 shrink-0 rounded-full border border-brand-gold/30 object-cover"
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
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-deep-green font-serif text-sm font-medium text-brand-gold"
      aria-label={alt}
    >
      {initials}
    </span>
  );
}
