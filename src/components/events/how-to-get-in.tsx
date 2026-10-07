import { Ticket, MessageCircle, DoorOpen } from "lucide-react";
import { wayIn, contactHref } from "@/lib/events/listing-checks";
import { formatPriceInfo } from "@/lib/price-parser";
import { isSafeUrl } from "@/lib/url-validation";
import type { Event } from "@/types";

/**
 * The one question a listing has to answer before anyone leaves the house:
 * how do I get in? Tickets, the organiser, or walk in at the venue — and if
 * the listing gave none of those, say so rather than leave a blank.
 */
export function HowToGetIn({ event }: { event: Event }) {
  const way = wayIn(event);
  const price = formatPriceInfo(event.price_info);

  return (
    <section className="mx-auto max-w-3xl px-4 pt-6 sm:px-6" aria-labelledby="how-to-get-in">
      <div className="rounded-xl border border-brand-gold/25 bg-brand-cream/50 p-4 dark:bg-brand-deep-green/10">
        <h2 id="how-to-get-in" className="font-serif text-lg font-medium text-brand-deep-green dark:text-brand-gold">
          How to get in
        </h2>
        {way?.kind === "tickets" && isSafeUrl(way.url) && (
          <p className="mt-2 flex items-start gap-2 text-sm text-foreground/85">
            <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
            <span>
              Book ahead:{" "}
              <a href={way.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
                get tickets
              </a>
              {price ? ` · ${price}` : ""}
            </span>
          </p>
        )}
        {way?.kind === "organiser" && (
          <p className="mt-2 flex items-start gap-2 text-sm text-foreground/85">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
            <span className="min-w-0 break-words">
              {`Ask the organiser${event.organizer_name ? ` (${event.organizer_name})` : ""}: `}
              {way.contact && (contactHref(way.contact) ? (
                <a href={contactHref(way.contact)!} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
                  {way.contact}
                </a>
              ) : (
                <span className="font-medium">{way.contact}</span>
              ))}
              {way.contact && way.instagram ? " or " : ""}
              {way.instagram && (
                <a
                  href={`https://instagram.com/${way.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  {`@${way.instagram.replace(/^@/, "")}`}
                </a>
              )}
              {price ? ` · ${price}` : ""}
            </span>
          </p>
        )}
        {way?.kind === "walk-in" && (
          <p className="mt-2 flex items-start gap-2 text-sm text-foreground/85">
            <DoorOpen className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
            <span className="min-w-0 break-words">
              No booking link was listed — turn up at <strong className="font-medium">{way.venue}</strong>
              {price ? ` (${price})` : ""}.{" "}
              <a
                href={
                  event.venue_map_url && isSafeUrl(event.venue_map_url)
                    ? event.venue_map_url
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${way.venue}, Ubud, Bali`)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                Directions
              </a>
            </span>
          </p>
        )}
        {!way && (
          <p className="mt-2 text-sm text-foreground/75">
            This listing didn&apos;t say how to get in. Check with the venue before you go.
          </p>
        )}
      </div>
    </section>
  );
}
