import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EventsHeroProps {
  /**
   * Optional cover image URL (any approved upcoming event with imagery
   * can be passed in). When present, the hero uses it as a full-bleed
   * background with a slow Ken-Burns animation. When absent, the hero
   * falls back to a layered brand-color composition.
   */
  backdropImageUrl?: string | null;
  backdropAlt?: string;
  /** Optional caption shown small near the bottom-right of the hero. */
  backdropCaption?: string | null;
  totalCount?: number;
}

const GRAIN_DATA_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.32 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function EventsHero({
  backdropImageUrl,
  backdropAlt,
  backdropCaption,
  totalCount,
}: EventsHeroProps) {
  const hasImage = !!backdropImageUrl;

  return (
    <section
      className="relative overflow-hidden bg-brand-deep-green text-brand-cream"
      aria-label="Events in Ubud"
    >
      {/* Backdrop image (Ken Burns) */}
      {hasImage && (
        <div className="absolute inset-0">
          <Image
            src={backdropImageUrl!}
            alt={backdropAlt ?? ""}
            fill
            priority
            sizes="100vw"
            className="object-cover motion-safe:animate-[kenburns_28s_ease-in-out_infinite_alternate]"
          />
        </div>
      )}

      {/* Brand gradient overlay — calibrated so dark photos still legible
          but lighter / colourful photos breathe through. */}
      <div
        aria-hidden
        className={
          hasImage
            ? "absolute inset-0 bg-gradient-to-b from-black/55 via-brand-deep-green/55 to-black/80"
            : "absolute inset-0 bg-gradient-to-br from-brand-deep-green via-brand-deep-green to-[#1c302a]"
        }
      />

      {/* When there's no photo, layer in painterly radial light pools
          (deep-green / gold / terracotta) so the hero still feels rich. */}
      {!hasImage && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(201,168,76,0.22),transparent_55%)]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_82%_82%,rgba(184,92,63,0.18),transparent_50%)]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(201,168,76,0.14),transparent_40%)]"
          />
        </>
      )}
      {/* Vignette */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_45%,rgba(0,0,0,0.45)_100%)]"
      />
      {/* Grain (subtle film-stock texture) */}
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-overlay opacity-30"
        style={{ backgroundImage: GRAIN_DATA_URL, backgroundRepeat: "repeat" }}
      />

      {/* Content */}
      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:py-28 lg:py-32">
        <div className="mx-auto mb-8 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-brand-gold/50" />
          <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-brand-gold/80">
            Ubud · This week and beyond
          </span>
          <span className="h-px w-10 bg-brand-gold/50" />
        </div>

        <h1 className="font-serif text-5xl font-medium leading-[1.05] tracking-tight text-brand-cream sm:text-6xl lg:text-7xl">
          What&apos;s happening
          <br className="hidden sm:block" />
          <span className="italic text-brand-gold/95"> in Ubud.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-brand-cream/80 sm:text-lg">
          Sound journeys, tantra evenings, ecstatic dance, sacred ceremonies,
          breathwork, deep-conversation circles —{" "}
          {typeof totalCount === "number" && totalCount > 0
            ? `${totalCount} gatherings curated daily.`
            : "curated daily from across the valley."}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            className="rounded-full bg-brand-cream px-7 py-6 text-sm font-semibold tracking-wide text-brand-deep-green shadow-lg transition hover:bg-white hover:shadow-xl"
          >
            <Link href="#events">Browse the agenda</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-brand-cream/30 bg-white/5 px-7 py-6 text-sm font-semibold tracking-wide text-brand-cream backdrop-blur-sm transition hover:border-brand-cream/60 hover:bg-white/10 hover:text-brand-cream"
          >
            <Link href="/events/submit">Submit an event</Link>
          </Button>
        </div>
      </div>

      {/* Backdrop caption (when an event image is in use) */}
      {hasImage && backdropCaption && (
        <div className="absolute bottom-3 right-4 hidden text-[10px] uppercase tracking-[0.18em] text-brand-cream/50 sm:block">
          Pictured: {backdropCaption}
        </div>
      )}

      <style>{`
        @keyframes kenburns {
          0%   { transform: scale(1) translate3d(0, 0, 0); }
          100% { transform: scale(1.08) translate3d(-1.5%, -1%, 0); }
        }
      `}</style>
    </section>
  );
}
