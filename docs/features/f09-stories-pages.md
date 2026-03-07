# F09: Stories Hub & Detail Pages

**Phase:** 3 — Humans of Ubud
**Depends on:** F08, F02
**Blocks:** F10, F30

---

## What

Public-facing pages for Humans of Ubud — the stories hub and individual story pages.

## Pages

- `src/app/humans-of-ubud/page.tsx` — Stories hub
- `src/app/humans-of-ubud/[slug]/page.tsx` — Individual story

## Components

- `src/components/stories/story-card.tsx` — Card for hub (photo, name, tagline, theme tags)
- `src/components/stories/story-grid.tsx` — Grid layout for hub

## Spec

### Stories Hub (`/humans-of-ubud`)
- Page title: "Humans of Ubud" with subtitle explaining the project
- Photo grid/card layout (masonry or 2-3 column grid)
- Each card: lead photo, subject name, tagline, theme tags as badges
- Click → individual story
- Only published stories shown
- Sorted by published_at (newest first)

### Individual Story (`/humans-of-ubud/[slug]`)
- Lead photo (large, hero-style)
- Subject name + Instagram link + tagline
- Theme tag badges
- Full narrative (rich text rendered)
- Additional photos interspersed or as gallery
- Share buttons (copy link, social)
- Newsletter signup CTA: "Stories like these, in your inbox every week."
- "Read More Stories" — 2-3 other stories at bottom

### SEO
- Dynamic meta title: "[Subject Name] — Humans of Ubud"
- Meta description from first ~160 chars of narrative
- OG image from lead photo
- Server-rendered

## Verification

- Published stories appear on hub page
- Individual story renders with photos and narrative
- Share buttons work
- Newsletter CTA visible
- SEO meta tags correct
- Responsive (especially photo layout)
