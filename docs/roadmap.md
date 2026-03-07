# The Ubudian — Master Roadmap

> The single source of truth for what we're building, in what order, and why.

---

## What Is The Ubudian?

A community media brand for Ubud, Bali's expat community. It combines storytelling ("Humans of Ubud"), a curated weekly newsletter, a free events directory, and insider tour experiences. The website is the home base.

**Core audience:** Ubud expat/nomad community.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15 (App Router) | SSR for SEO, React, API routes, fast dev |
| UI | Tailwind CSS + shadcn/ui | Rapid development, consistent design |
| Database | Supabase (PostgreSQL + Auth + Storage) | All-in-one, free tier, RLS |
| Newsletter | Beehiiv | Deliverability from day 1, API, free to 2,500 subs |
| Transactional Email | Resend + React Email | Event confirmations, admin alerts only |
| Hosting | Vercel | Zero-config Next.js, free tier |
| Automation (Phase 2) | n8n | Newsletter draft generation, event aggregation |

**Launch cost: ~$1/month** (domain only — all services on free tiers)

---

## Build Phases

Each phase is a set of features that build on the previous. Features are documented individually in `docs/features/`.

### Phase 1: Foundation
Get the project running with core layout and infrastructure.

| Feature | Doc | Depends On |
|---------|-----|------------|
| F01: Project Scaffolding | `f01-project-scaffolding.md` | — |
| F02: Layout & Navigation | `f02-layout-navigation.md` | F01 |
| F03: Admin Auth | `f03-admin-auth.md` | F01 |
| F04: Admin Dashboard Shell | `f04-admin-dashboard.md` | F02, F03 |

### Phase 2: Content Platform
Blog system and foundational content — the narrative base for outreach.

| Feature | Doc | Depends On |
|---------|-----|------------|
| F05: Blog System | `f05-blog-system.md` | F02, F04 |
| F06: Blog Content (Collaborative) | `f06-blog-content.md` | F05 |
| F07: About Page | `f07-about-page.md` | F02 |

### Phase 3: Humans of Ubud
The storytelling platform — the emotional core.

| Feature | Doc | Depends On |
|---------|-----|------------|
| F08: Stories CRUD & Admin | `f08-stories-crud.md` | F04 |
| F09: Stories Hub & Detail Pages | `f09-stories-pages.md` | F08, F02 |
| F10: Story Theme Filtering | `f10-story-filters.md` | F09 |

### Phase 4: Events Directory
The utility engine that brings people to the site.

| Feature | Doc | Depends On |
|---------|-----|------------|
| F11: Events Data Model & Admin CRUD | `f11-events-crud.md` | F04 |
| F12: Events List View | `f12-events-list-view.md` | F11, F02 |
| F13: Events Calendar View | `f13-events-calendar-view.md` | F11 |
| F14: Events Week View | `f14-events-week-view.md` | F11 |
| F15: Event Detail Page & SEO | `f15-event-detail-page.md` | F11, F02 |
| F16: Event Category Filters | `f16-event-filters.md` | F12 |
| F17: Event Search | `f17-event-search.md` | F12 |
| F18: Public Event Submission | `f18-event-submission.md` | F11 |
| F19: Event Moderation Queue | `f19-event-moderation.md` | F18, F04 |
| F20: Trusted Submitters | `f20-trusted-submitters.md` | F19 |
| F21: Recurring Events | `f21-recurring-events.md` | F11 |

### Phase 5: Tours
The core revenue product.

| Feature | Doc | Depends On |
|---------|-----|------------|
| F22: Tours Data Model & Admin | `f22-tours-crud.md` | F04 |
| F23: Tours Overview & Detail Pages | `f23-tours-pages.md` | F22, F02 |
| F24: WhatsApp Booking CTA | `f24-booking-cta.md` | F23 |

### Phase 6: Newsletter
Compose, distribute via Beehiiv, archive on site.

| Feature | Doc | Depends On |
|---------|-----|------------|
| F25: Newsletter Subscriber Signup | `f25-newsletter-signup.md` | F02 |
| F26: Newsletter Composer (Admin) | `f26-newsletter-composer.md` | F04, F08, F11, F22 |
| F27: Beehiiv API Integration | `f27-beehiiv-integration.md` | F26 |
| F28: Newsletter Web Archive | `f28-newsletter-archive.md` | F26, F02 |
| F29: Subscriber Management | `f29-subscriber-management.md` | F27, F04 |

### Phase 7: Landing Page (Full)
Assembles everything into the homepage. Built last because it pulls from all content types.

| Feature | Doc | Depends On |
|---------|-----|------------|
| F30: Landing Page | `f30-landing-page.md` | F09, F12, F23, F28 |

### Phase 8: Polish & Launch
Final touches and deployment.

| Feature | Doc | Depends On |
|---------|-----|------------|
| F31: SEO & Meta Tags | `f31-seo-meta.md` | All public pages |
| F32: Responsive Design Audit | `f32-responsive-audit.md` | All pages |
| F33: Deployment | `f33-deployment.md` | All features |

### Future: Phase 9+
| Feature | Notes |
|---------|-------|
| n8n Newsletter Automation | Auto-draft weekly newsletter from events DB |
| Contributor Ecosystem | Other community voices writing columns |
| Multi-Language Support | Tour pages + key content in multiple languages |
| Stripe Tour Booking | Online payment for tours |
| Featured Business Listings | Paid directory listings |
| Retreat Affiliate Tracking | Commission tracking on referrals |

---

## Design Direction

**Colors:** Warm green `#5B7B5E` / Terracotta `#C4705A` / Cream `#FAF7F2` / Charcoal `#2D2D2D` / Gold `#C4A35A`

**Typography:** Serif headings (Playfair Display / Lora) + Sans-serif body (Inter / DM Sans)

**Feel:** Warm, earthy, photography-forward, generous whitespace, calm. Like a letter from a friend.

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/roadmap.md` | This file — master plan and phase overview |
| `docs/business-plan.md` | Revenue model, strategy, positioning |
| `docs/features/` | Individual feature specs (one per file) |
| `docs/mocks/` | Experimental UI / design explorations |
| `the-ubudian-brainstorm.md` | Raw brainstorm notes (reference only) |

---

## Database Schema

Full schema in individual feature docs. Summary of tables:

- `blog_posts` — title, slug, content, cover_image, status, SEO fields
- `stories` — subject_name, instagram, photos, narrative, theme_tags, status
- `events` — title, category, venue, dates/times, recurrence, price, organizer, moderation status
- `tours` — title, description, itinerary, price, photos, booking info
- `newsletter_editions` — subject, content_json, html, sponsor info, beehiiv reference
- `newsletter_subscribers` — email, name, birthday, instagram, beehiiv sync
- `trusted_submitters` — email, approved_count, auto_approve flag

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BEEHIIV_API_KEY=
BEEHIIV_PUBLICATION_ID=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=
ADMIN_EMAIL=
```
