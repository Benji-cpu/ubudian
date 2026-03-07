# F05: Blog System

**Phase:** 2 — Content Platform
**Depends on:** F02, F04
**Blocks:** F06

---

## What

Blog listing page, individual post pages, and admin CRUD. Home for foundational content and future editorial pieces.

## Pages

- `src/app/blog/page.tsx` — Blog listing
- `src/app/blog/[slug]/page.tsx` — Individual post
- `src/app/admin/blog/page.tsx` — Admin blog list
- `src/app/admin/blog/new/page.tsx` — Create post
- `src/app/admin/blog/[id]/edit/page.tsx` — Edit post

## Components

- `src/components/blog/post-card.tsx` — Card for listing (cover image, title, excerpt, date)
- `src/components/admin/blog-form.tsx` — Create/edit form

## Spec

### Blog Listing (`/blog`)
- Card grid (2 columns desktop, 1 mobile)
- Each card: cover image, title, excerpt, date
- Only published posts shown
- Sorted newest first

### Individual Post (`/blog/[slug]`)
- Cover image (full width)
- Title, date, estimated read time
- Rich text content
- Share buttons (copy link, social)
- Newsletter signup CTA at bottom ("Enjoyed this? Get The Ubudian weekly.")
- "More from The Ubudian" — 2-3 related posts

### Admin Blog Form
- Title input
- Slug (auto-generated from title, editable)
- Rich text editor (from F04 shared component)
- Cover image upload (from F04 shared component)
- Excerpt (short text for cards)
- SEO fields: meta title, meta description
- Status: draft / published
- Save + Publish buttons

### SEO
- Dynamic meta tags from post fields
- OG image from cover image
- Server-rendered for Google indexing

## Verification

- Create blog post in admin → appears on `/blog`
- Individual post page renders with full content
- Share buttons work
- Newsletter CTA visible at bottom
- Responsive layout
