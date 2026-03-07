# The Ubudian

Community media platform for Ubud, Bali — events, stories, tours, and a weekly newsletter.

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript
- **Database**: Supabase (Postgres + Auth + Storage)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Newsletter**: Beehiiv (distribution), Resend (transactional email)
- **Forms**: Zod + React Hook Form + zodResolver

## Commands

```bash
npm run dev       # Dev server on port 4000
npm run build     # Production build
npm run lint      # ESLint
```

## Architecture

- `/src/app` — Pages and API routes (App Router)
- `/src/components` — `ui/` (shadcn), `admin/`, `blog/`, `stories/`, `events/`, `tours/`, `newsletter/`, `homepage/`, `layout/`
- `/src/lib` — Supabase clients (`server.ts`, `client.ts`, `admin.ts`), `utils.ts`, `constants.ts`, `auth.ts`
- `/src/types` — All TypeScript interfaces in `index.ts`
- `/supabase` — `schema.sql` (full database schema)
- Path alias: `@/` maps to `./src/*`

## Key Conventions

- Server Components by default; add `"use client"` only when needed
- Supabase server client for reads, browser client for mutations, admin client (service role) for API routes
- Forms: Zod schema + RHF + zodResolver pattern (see `blog-form.tsx` as template)
- Data fetching: `(data ?? []) as Type[]` pattern for arrays
- Slugs: auto-generated from title via `slugify()`, manually editable

## Brand

- **Colors**: deep-green `#2C4A3E`, gold `#C9A84C`, cream `#FAF5EC`, terracotta `#B85C3F`, charcoal `#2D2D2D`
- **Fonts**: Lora (serif headings), Source Sans 3 (body)
- **CSS vars**: `brand-deep-green`, `brand-gold`, `brand-cream`, `brand-terracotta`, etc.

## Database

- 8 tables: `profiles`, `blog_posts`, `stories`, `events`, `tours`, `newsletter_editions`, `newsletter_subscribers`, `trusted_submitters`
- All tables have RLS enabled
- `is_admin()` SQL function checks admin role
- Never expose service role key to client
- Public reads filtered by `status`/`is_active`

## Important Notes

- Event submission API (`/api/events/submit`) uses admin client — anon RLS can't insert events
- Image uploads go to `images` bucket with folder prefix (e.g., `blog/`, `stories/`, `events/`, `tours/`)
- Event status: `pending/approved/rejected/archived` (not draft/published)
- Tours use `is_active` boolean toggle (no draft/publish workflow)
- Newsletter editions use `draft/published/archived` with `sent_at` timestamp
- Stories route: `/stories` (nav says "Humans of Ubud")
