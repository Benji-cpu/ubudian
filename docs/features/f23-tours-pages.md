# F23: Tours Overview & Detail Pages

**Phase:** 5 — Tours
**Depends on:** F22, F02
**Blocks:** F24, F30

---

## What

Public-facing tour pages — overview listing and individual tour details.

## Pages

- `src/app/tours/page.tsx` — Tours overview
- `src/app/tours/[slug]/page.tsx` — Individual tour detail

## Components

- `src/components/tours/tour-card.tsx` — Card for overview page

## Spec

### Tours Overview (`/tours`)
- Brand intro section: "The Ubudian Secret Tours" — short narrative about what makes these different (not tourist tours — insider days with a local friend)
- Tour cards in a grid:
  - Lead photo
  - Title
  - Duration + price
  - Short description
  - Theme badge
  - "Learn More" link
- Newsletter signup CTA at bottom

### Individual Tour (`/tours/[slug]`)
- Photo gallery (hero image + thumbnails)
- Title + theme badge
- Duration, price, max group size
- Full description
- Itinerary (step-by-step flow with times)
- What's included
- What to bring
- Booking CTA (see F24)
- "Other Tours" — cards for remaining tours

### SEO
- Meta title: "[Tour Name] — The Ubudian Secret Tours"
- Meta description from short_description
- OG image from lead photo

## Verification

- Active tours appear on overview page
- Inactive tours hidden
- Individual tour pages render with all sections
- Photo gallery works
- SEO meta tags correct
- Responsive
