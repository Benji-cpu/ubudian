# F02: Layout & Navigation

**Phase:** 1 — Foundation
**Depends on:** F01
**Blocks:** F05, F07, F09, F12, F15, F23, F25, F28, F30

---

## What

Root layout with responsive header, mobile menu, and footer. This wraps every page.

## Pages

- `src/app/layout.tsx` — Root layout

## Components

- `src/components/layout/header.tsx` — Desktop nav + mobile hamburger trigger
- `src/components/layout/mobile-menu.tsx` — Slide-out mobile nav (shadcn Sheet)
- `src/components/layout/footer.tsx` — Links, social icons, newsletter signup
- `src/components/layout/newsletter-signup.tsx` — Reusable email signup form (used in footer, landing page, blog posts, stories)

## Spec

### Header
- Logo (left): "The Ubudian" in brand serif font
- Nav links (center/right): Events | Humans of Ubud | Tours | Newsletter | Blog
- Mobile: hamburger icon → slide-out sheet with same links
- Sticky on scroll, subtle background blur

### Footer
- Three columns: Navigation links | Newsletter signup form | Social links (Instagram, etc.)
- Copyright line
- Warm cream background, subtle top border

### Newsletter Signup Component
- Reusable form: email input + "Subscribe" button
- Optionally: first name field
- On submit: POST to `/api/newsletter/subscribe` → Beehiiv API
- Success state: "Welcome to The Ubudian!" message
- Error state: validation + API error handling

## Verification

- Nav renders on desktop and mobile
- Mobile menu opens/closes
- All nav links point to correct routes
- Newsletter signup form submits (can test with placeholder API)
- Responsive at 375px, 768px, 1280px
