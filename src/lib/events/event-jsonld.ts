import type { Event } from "@/types";
import { SITE_URL } from "@/lib/constants";
import { displayPrice } from "@/lib/price-display";
import { isSafeUrl } from "@/lib/url-validation";
import { addDays } from "./timetable";

/** Bali has one offset all year (Asia/Makassar, no daylight saving). */
const BALI_OFFSET = "+08:00";

/** "2026-11-10" + "19:00:00" → "2026-11-10T19:00:00+08:00"; a date alone stays a date. */
export function baliDateTime(date: string, time: string | null): string {
  if (!time) return date;
  const [h = "00", m = "00", s = "00"] = time.split(":");
  return `${date}T${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.slice(0, 2).padStart(2, "0")}${BALI_OFFSET}`;
}

/**
 * One schema.org Event for a listing as it shows on a dated page: this
 * occurrence's date (a weekly class's next Thursday, not its seed date), in
 * Bali time, priced the way the page prices it. Each points at its own event
 * page, so a list page's events lead to their leaf pages.
 */
export function eventJsonLd(e: Event, siteUrl: string = SITE_URL): Record<string, unknown> {
  const url = `${siteUrl}/events/${e.slug}`;
  const multiDay = !!e.end_date && e.end_date > e.start_date;
  let endDate: string | undefined;
  if (e.end_time) {
    // 10pm to 2am ends the next day.
    const overnight = !multiDay && !!e.start_time && e.end_time < e.start_time;
    endDate = baliDateTime(multiDay ? e.end_date! : overnight ? addDays(e.start_date, 1) : e.start_date, e.end_time);
  } else if (multiDay) {
    endDate = e.end_date!;
  }

  const price = displayPrice(e.price_info);
  const offerUrl = e.external_ticket_url && isSafeUrl(e.external_ticket_url) ? e.external_ticket_url : url;
  const offers =
    price.kind === "free"
      ? { "@type": "Offer", price: 0, priceCurrency: "IDR", url: offerUrl }
      : price.amount
        ? price.amount.min === price.amount.max
          ? { "@type": "Offer", price: price.amount.min, priceCurrency: price.amount.currency, url: offerUrl }
          : {
              "@type": "AggregateOffer",
              lowPrice: price.amount.min,
              highPrice: price.amount.max,
              priceCurrency: price.amount.currency,
              url: offerUrl,
            }
        : null;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    startDate: baliDateTime(e.start_date, e.start_time),
    ...(endDate && { endDate }),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.venue_name || "Ubud",
      address: {
        "@type": "PostalAddress",
        ...(e.venue_address && { streetAddress: e.venue_address }),
        addressLocality: "Ubud",
        addressRegion: "Bali",
        addressCountry: "ID",
      },
      ...(e.latitude != null && e.longitude != null && { geo: { "@type": "GeoCoordinates", latitude: e.latitude, longitude: e.longitude } }),
    },
    ...(e.short_description && { description: e.short_description }),
    ...(e.cover_image_url && { image: [e.cover_image_url] }),
    ...(e.organizer_name && { organizer: { "@type": "Organization", name: e.organizer_name } }),
    ...(offers && { offers }),
    url,
  };
}

/** JSON for a `<script type="application/ld+json">`, with `<` escaped so a title can't close the tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
