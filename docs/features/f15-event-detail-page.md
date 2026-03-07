# F15: Event Detail Page & SEO

**Phase:** 4 — Events Directory
**Depends on:** F11, F02
**Blocks:** None

---

## What

Individual event page with full details, map link, ticket link, and structured data for SEO.

## Pages

- `src/app/events/[slug]/page.tsx`

## Spec

### Page Layout
- Cover image (if available, full width)
- Title (large)
- Category badge
- Date & time (formatted nicely: "Tuesday, February 15, 2026 · 7:00 PM - 9:00 PM")
- Recurring indicator if applicable ("Every Tuesday")
- Venue: name + address + "View on Maps" link
- Price info
- Description (rich text rendered)
- Organizer info: name + Instagram link
- External ticket button: "Get Tickets on Megatix" (opens in new tab) — only if external_ticket_url exists
- Share buttons
- "More Events This Week" — 3-4 other upcoming events

### SEO / Structured Data
- JSON-LD Event schema:
  ```json
  {
    "@type": "Event",
    "name": "...",
    "startDate": "2026-02-15T19:00:00+08:00",
    "endDate": "2026-02-15T21:00:00+08:00",
    "location": { "@type": "Place", "name": "...", "address": "..." },
    "description": "...",
    "offers": { "@type": "Offer", "price": "...", "url": "..." }
  }
  ```
- Dynamic meta title: "[Event Name] — The Ubudian"
- Meta description from short_description
- OG image from cover image

## Verification

- Event detail page renders with all info
- Map link opens Google Maps
- External ticket button works (new tab)
- JSON-LD structured data present in page source
- Share buttons work
- "More Events" section shows related events
