import Image from "next/image";
import Link from "next/link";
import { Sun, Sunrise, Moon, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { ShareDayButton } from "@/components/journeys/share-day-button";
import { AtomLightbox } from "@/components/journeys/atom-lightbox";
import type {
  JourneyAtom,
  JourneyAtomKind,
  JourneyDay,
  JourneyDaySlot,
  JourneyDayType,
  JourneyDayWindow,
} from "@/types";

interface JourneyDayCardProps {
  day: JourneyDay;
  slots: JourneyDaySlot[];
  candidatesBySlot: Map<string, JourneyAtom[]>;
  eventSlugs: Map<string, string>;
  /** When provided, enables per-day share/deep-link UX. */
  journeyTitle?: string;
  journeyUrl?: string;
  /**
   * Map of partner_id → sponsor slug for partners that are also active
   * Anchor-tier community partners. Atoms with a matching partner_id render
   * their title with a subtle gold underline that links to the partner profile.
   */
  anchorPartnerSlugs?: Map<string, string>;
}

const DAY_TYPE_LABEL: Record<JourneyDayType, string> = {
  arrival: "Arrival",
  light: "Light",
  active: "Active",
  rest: "Rest",
  closing: "Closing",
};

const DAY_TYPE_INK: Record<JourneyDayType, string> = {
  arrival: "text-brand-gold",
  light: "text-brand-deep-green/65",
  active: "text-brand-terracotta",
  rest: "text-brand-deep-green/55",
  closing: "text-brand-deep-green",
};

const WINDOW_ORDER: JourneyDayWindow[] = ["morning", "afternoon", "evening"];
const WINDOW_LABEL: Record<JourneyDayWindow, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};
const WINDOW_ICON: Record<JourneyDayWindow, React.ComponentType<{ className?: string }>> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Moon,
};

const ATOM_KIND_LABEL: Record<JourneyAtomKind, string> = {
  event_ref: "Event",
  accommodation: "Stay",
  restaurant: "Eat",
  practitioner: "Practitioner",
  place: "Place",
  ritual: "Ritual",
  reflection: "Reflection",
};

export function JourneyDayCard({
  day,
  slots,
  candidatesBySlot,
  eventSlugs,
  journeyTitle,
  journeyUrl,
  anchorPartnerSlugs,
}: JourneyDayCardProps) {
  const slotsByWindow = new Map<JourneyDayWindow, JourneyDaySlot[]>();
  for (const w of WINDOW_ORDER) slotsByWindow.set(w, []);
  for (const s of slots) {
    slotsByWindow.get(s.slot_window)?.push(s);
  }

  // Collect atoms-with-images surfaced today. The first one becomes the
  // day's lead hero (16:9 banner under the header). Up to three follow-ons
  // sit below as a thumb strip. Both click into the AtomLightbox.
  const heroAtoms: JourneyAtom[] = [];
  const seenAtomIds = new Set<string>();
  for (const ws of slotsByWindow.values()) {
    for (const slot of ws) {
      const atoms = candidatesBySlot.get(slot.id) ?? [];
      for (const atom of atoms) {
        if (atom.image_url && !seenAtomIds.has(atom.id) && heroAtoms.length < 4) {
          seenAtomIds.add(atom.id);
          heroAtoms.push(atom);
        }
      }
    }
  }
  const leadAtom = heroAtoms[0];
  const supportingAtoms = heroAtoms.slice(1);

  return (
    <article
      id={`day-${day.day_number}`}
      className="scroll-mt-24 overflow-hidden rounded-md border border-brand-gold/20 bg-card"
    >
      <header className="relative overflow-hidden border-b border-brand-gold/15 bg-brand-cream/30 px-5 py-6 sm:px-6 sm:py-8">
        {day.background_image_url && (
          <>
            <Image
              src={day.background_image_url}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="absolute inset-0 -z-10 object-cover opacity-25"
              aria-hidden
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-cream/80 via-brand-cream/55 to-brand-cream/30" aria-hidden />
          </>
        )}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-xs uppercase tracking-[0.3em] text-brand-gold">
              Day {String(day.day_number).padStart(2, "0")}
            </span>
            <span className="text-brand-gold/40">·</span>
            <span className={`font-serif text-sm italic ${DAY_TYPE_INK[day.day_type]}`}>
              {DAY_TYPE_LABEL[day.day_type]}
            </span>
          </div>
          {journeyTitle && journeyUrl && (
            <ShareDayButton
              journeyTitle={journeyTitle}
              journeyUrl={journeyUrl}
              dayNumber={day.day_number}
              dayTheme={day.theme}
            />
          )}
        </div>
        <h3 className="mt-4 font-serif text-2xl font-medium leading-tight text-brand-deep-green sm:text-[1.7rem]">
          {day.theme}
        </h3>
        {day.theme_subtitle && (
          <p className="mt-1.5 font-serif text-base italic text-foreground/65">{day.theme_subtitle}</p>
        )}
      </header>

      {leadAtom && (
        <AtomLightbox atom={leadAtom}>
          <div className="group relative aspect-[16/10] w-full overflow-hidden border-b border-brand-gold/15 sm:aspect-[2/1]">
            <Image
              src={leadAtom.image_url as string}
              alt={leadAtom.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6">
              <span className="text-[10px] uppercase tracking-[0.2em] text-brand-gold">
                {ATOM_KIND_LABEL[leadAtom.kind]}
              </span>
              <p className="mt-1 font-serif text-xl font-medium leading-tight sm:text-2xl">
                {leadAtom.title}
              </p>
              {leadAtom.short_description && (
                <p className="mt-1 line-clamp-2 max-w-xl text-sm opacity-90">
                  {leadAtom.short_description}
                </p>
              )}
            </div>
          </div>
        </AtomLightbox>
      )}

      {supportingAtoms.length > 0 && (
        <div className="grid grid-cols-3 gap-1 border-b border-brand-gold/15 bg-brand-cream/10">
          {supportingAtoms.map((atom) => (
            <AtomLightbox key={atom.id} atom={atom}>
              <div className="group relative aspect-[5/4] overflow-hidden">
                <Image
                  src={atom.image_url as string}
                  alt={atom.title}
                  fill
                  sizes="(max-width: 640px) 33vw, 220px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </AtomLightbox>
          ))}
        </div>
      )}

      <div className="px-5 py-5 sm:px-6">
        {day.intention && (
          <div className="mb-5 text-base leading-relaxed text-foreground/90">
            <MarkdownContent content={day.intention} />
          </div>
        )}

        {day.day_type === "rest" && slots.length === 0 && (
          <p className="text-sm italic text-muted-foreground">
            No agenda. Rest is the practice today.
          </p>
        )}

        <div className="space-y-5">
          {WINDOW_ORDER.map((w) => {
            const ws = slotsByWindow.get(w) ?? [];
            if (ws.length === 0) return null;
            const Icon = WINDOW_ICON[w];
            return (
              <div key={w}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-gold">
                  <Icon className="h-4 w-4" />
                  <span>{WINDOW_LABEL[w]}</span>
                </div>
                <ul className="mt-2 space-y-3">
                  {ws.map((slot) => (
                    <SlotRow
                      key={slot.id}
                      slot={slot}
                      candidates={candidatesBySlot.get(slot.id) ?? []}
                      eventSlugs={eventSlugs}
                      anchorPartnerSlugs={anchorPartnerSlugs}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function SlotRow({
  slot,
  candidates,
  eventSlugs,
  anchorPartnerSlugs,
}: {
  slot: JourneyDaySlot;
  candidates: JourneyAtom[];
  eventSlugs: Map<string, string>;
  anchorPartnerSlugs?: Map<string, string>;
}) {
  return (
    <li className="rounded border border-brand-gold/15 bg-brand-cream/15 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {slot.prompt && (
            <p className="text-sm font-medium text-brand-deep-green">{slot.prompt}</p>
          )}
          {slot.is_optional && (
            <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-muted-foreground">
              Optional
            </span>
          )}
        </div>
      </div>
      {candidates.length > 0 && (
        <ul className="mt-2 space-y-2">
          {candidates.map((atom) => (
            <AtomLine
              key={atom.id}
              atom={atom}
              eventSlugs={eventSlugs}
              anchorPartnerSlugs={anchorPartnerSlugs}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function AtomLine({
  atom,
  eventSlugs,
  anchorPartnerSlugs,
}: {
  atom: JourneyAtom;
  eventSlugs: Map<string, string>;
  anchorPartnerSlugs?: Map<string, string>;
}) {
  const href = atomHref(atom, eventSlugs);
  const useLightbox = !!atom.image_url;
  const actionLabel =
    atom.kind === "event_ref"
      ? "Open event"
      : atom.kind === "accommodation" || atom.kind === "restaurant"
      ? "Visit"
      : "Open";
  const anchorPartnerSlug = atom.partner_id
    ? anchorPartnerSlugs?.get(atom.partner_id) ?? null
    : null;
  const inner = (
    <>
      {atom.image_url ? (
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-brand-gold/25 sm:h-16 sm:w-16">
          <Image
            src={atom.image_url}
            alt=""
            fill
            sizes="64px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 ring-0 ring-brand-gold/40 transition-all duration-500 group-hover:ring-1" />
        </div>
      ) : (
        <Badge variant="outline" className="shrink-0 text-[10px] uppercase tracking-wider">
          {ATOM_KIND_LABEL[atom.kind]}
        </Badge>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {atom.image_url && (
            <span className="text-[10px] uppercase tracking-wider text-brand-gold">
              {ATOM_KIND_LABEL[atom.kind]}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-foreground">
          {anchorPartnerSlug ? (
            <span className="underline decoration-brand-gold/50 underline-offset-4 decoration-1">
              {atom.title}
            </span>
          ) : (
            atom.title
          )}
        </p>
        {atom.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{atom.short_description}</p>
        )}
        {anchorPartnerSlug && (
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-brand-gold/80">
            Community partner
          </p>
        )}
      </div>
      {href?.startsWith("http") && (
        <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}
    </>
  );
  return (
    <li>
      {useLightbox ? (
        <AtomLightbox atom={atom} actionHref={href ?? undefined} actionLabel={actionLabel}>
          <div className="group flex items-start gap-3 rounded-sm px-1 py-1 transition-colors hover:bg-brand-cream/40">
            {inner}
          </div>
        </AtomLightbox>
      ) : href ? (
        <Link
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="group flex items-start gap-3 rounded-sm px-1 py-1 hover:bg-brand-cream/40"
        >
          {inner}
        </Link>
      ) : (
        <div className="group flex items-start gap-3 px-1 py-1">{inner}</div>
      )}
      {atom.image_url && atom.image_credit && (
        <p className="ml-[3.75rem] mt-0.5 text-[10px] text-muted-foreground/80 sm:ml-[4.25rem]">
          {atom.image_credit_url ? (
            <a
              href={atom.image_credit_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline"
            >
              {atom.image_credit} &rarr;
            </a>
          ) : (
            atom.image_credit
          )}
        </p>
      )}
    </li>
  );
}

function atomHref(atom: JourneyAtom, eventSlugs: Map<string, string>): string | null {
  if (atom.kind === "event_ref" && atom.event_id) {
    const slug = eventSlugs.get(atom.event_id);
    return slug ? `/events/${slug}` : null;
  }
  if (atom.affiliate_url) return atom.affiliate_url;
  if (atom.google_maps_url) return atom.google_maps_url;
  return null;
}
