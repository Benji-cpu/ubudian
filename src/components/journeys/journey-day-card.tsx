import Image from "next/image";
import Link from "next/link";
import { Sun, Sunrise, Moon, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/blog/markdown-content";
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
}

const DAY_TYPE_LABEL: Record<JourneyDayType, string> = {
  arrival: "Arrival",
  light: "Light day",
  active: "Active day",
  rest: "Rest day",
  closing: "Closing",
};

const DAY_TYPE_TONE: Record<JourneyDayType, string> = {
  arrival: "bg-brand-gold/15 text-brand-deep-green",
  light: "bg-brand-deep-green/10 text-brand-deep-green",
  active: "bg-brand-terracotta/15 text-brand-terracotta",
  rest: "bg-brand-cream text-brand-deep-green/70 border border-brand-gold/30",
  closing: "bg-brand-deep-green/15 text-brand-deep-green",
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

export function JourneyDayCard({ day, slots, candidatesBySlot, eventSlugs }: JourneyDayCardProps) {
  const slotsByWindow = new Map<JourneyDayWindow, JourneyDaySlot[]>();
  for (const w of WINDOW_ORDER) slotsByWindow.set(w, []);
  for (const s of slots) {
    slotsByWindow.get(s.slot_window)?.push(s);
  }

  return (
    <article className="overflow-hidden rounded-md border border-brand-gold/20 bg-card">
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
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-brand-deep-green px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-cream">
            Day {day.day_number}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${DAY_TYPE_TONE[day.day_type]}`}>
            {DAY_TYPE_LABEL[day.day_type]}
          </span>
        </div>
        <h3 className="mt-3 font-serif text-xl font-medium text-brand-deep-green sm:text-2xl">
          {day.theme}
        </h3>
        {day.theme_subtitle && (
          <p className="mt-1 text-sm italic text-muted-foreground">{day.theme_subtitle}</p>
        )}
      </header>

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
}: {
  slot: JourneyDaySlot;
  candidates: JourneyAtom[];
  eventSlugs: Map<string, string>;
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
            <AtomLine key={atom.id} atom={atom} eventSlugs={eventSlugs} />
          ))}
        </ul>
      )}
    </li>
  );
}

function AtomLine({ atom, eventSlugs }: { atom: JourneyAtom; eventSlugs: Map<string, string> }) {
  const href = atomHref(atom, eventSlugs);
  const inner = (
    <>
      {atom.image_url ? (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-brand-gold/20">
          <Image
            src={atom.image_url}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
            aria-hidden
          />
        </div>
      ) : (
        <Badge variant="outline" className="shrink-0 text-[10px] uppercase tracking-wider">
          {ATOM_KIND_LABEL[atom.kind]}
        </Badge>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {atom.image_url && (
            <span className="text-[10px] uppercase tracking-wider text-brand-gold">
              {ATOM_KIND_LABEL[atom.kind]}
            </span>
          )}
        </div>
        <p className="truncate text-sm font-medium text-foreground">{atom.title}</p>
        {atom.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{atom.short_description}</p>
        )}
      </div>
      {href?.startsWith("http") && (
        <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}
    </>
  );
  return (
    <li>
      {href ? (
        <Link
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="flex items-start gap-2 rounded-sm px-1 py-1 hover:bg-brand-cream/40"
        >
          {inner}
        </Link>
      ) : (
        <div className="flex items-start gap-2 px-1 py-1">{inner}</div>
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
