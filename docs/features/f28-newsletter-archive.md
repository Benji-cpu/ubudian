# F28: Newsletter Web Archive

**Phase:** 6 — Newsletter
**Depends on:** F26, F02
**Blocks:** F30

---

## What

Public-facing pages showing past newsletter editions on the website. Good for SEO and for people who want to see what they're subscribing to.

## Pages

- `src/app/newsletter/page.tsx` — Archive listing
- `src/app/newsletter/[slug]/page.tsx` — Individual edition

## Components

- `src/components/newsletter/edition-card.tsx` — Card for listing
- `src/components/newsletter/edition-renderer.tsx` — Renders newsletter content on web

## Spec

### Archive Listing (`/newsletter`)
- Page title: "The Ubudian Newsletter" + subtitle + signup CTA
- Card grid of past editions (newest first)
- Each card: subject line, date, preview text
- Only editions with `status: 'sent'` shown
- Newsletter signup form for people who haven't subscribed yet

### Individual Edition (`/newsletter/[slug]`)
- Full newsletter content rendered as web page (not email HTML — a clean web version)
- All sections rendered: story excerpt, weekly flow, bulletin, cultural moment, etc.
- "Subscribe to get this in your inbox every week" CTA
- Share buttons
- Nav to previous/next editions

### Edition Renderer
- Takes `content_json` and renders each section as clean web components
- Different from the email HTML template (web version can use modern CSS, richer layout)
- Links to full story, event detail pages, tour pages (deep linking within the site)

### SEO
- Each edition is a rich, indexable page
- Meta title: "The Ubudian — [Subject]"
- Great for long-tail SEO: "ubud events february 2026" etc.

## Verification

- Sent editions appear in archive listing
- Draft editions hidden
- Individual edition page renders all sections
- Links within edition point to correct pages (stories, events, tours)
- Newsletter signup CTA works
- Responsive
