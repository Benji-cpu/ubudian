# F31: SEO & Meta Tags

**Phase:** 8 — Polish & Launch
**Depends on:** All public pages
**Blocks:** F33

---

## What

Ensure all public pages have proper meta tags, OG images, and structured data for SEO and social sharing.

## Spec

### Per-Page Meta Tags
Every public page needs:
- `<title>` — dynamic, descriptive
- `<meta name="description">` — 150-160 chars
- `<meta property="og:title">`
- `<meta property="og:description">`
- `<meta property="og:image">` — 1200x630px
- `<meta property="og:url">`
- `<meta name="twitter:card" content="summary_large_image">`

### Dynamic OG Images
- Events: use cover_image or generate with event title/date
- Stories: use lead photo
- Blog: use cover_image
- Tours: use lead photo
- Default: The Ubudian branded OG image for pages without specific images

### Structured Data (JSON-LD)
- Events: Event schema (already in F15)
- Blog posts: Article schema
- Stories: Article schema
- Tours: Product or TouristTrip schema
- Organization: on homepage

### Technical
- Use Next.js `generateMetadata()` for dynamic meta per page
- Sitemap: `src/app/sitemap.ts` — auto-generate from all published content
- Robots.txt: allow all public pages, block `/admin`
- Canonical URLs on all pages

### Components
- `src/components/shared/seo-head.tsx` — reusable meta tag helper (if needed beyond Next.js built-in)

## Verification

- Test all page types with https://ogp.me/ or social media debuggers
- Google Rich Results Test passes for events
- Sitemap accessible at `/sitemap.xml`
- Robots.txt blocks admin
- Social share preview looks good (Facebook, Twitter, WhatsApp)
