# F01: Project Scaffolding

**Phase:** 1 — Foundation
**Depends on:** Nothing (this is the starting point)
**Blocks:** All other features

---

## What

Initialize the Next.js project with all core dependencies, configure the brand theme, set up Supabase, and create the database schema.

## Tasks

1. `npx create-next-app@latest` — TypeScript, Tailwind, App Router, src/ directory
2. Install dependencies:
   - `@supabase/supabase-js` `@supabase/ssr` — Database + Auth
   - `resend` `@react-email/components` — Transactional email
   - `date-fns` — Date formatting
   - `lucide-react` — Icons
3. Initialize shadcn/ui + install core components: button, card, input, textarea, label, dialog, tabs, calendar, table, badge, dropdown-menu, separator, sheet, select, form
4. Configure `tailwind.config.ts` with brand theme:
   - Colors: green `#5B7B5E`, terracotta `#C4705A`, cream `#FAF7F2`, charcoal `#2D2D2D`, gold `#C4A35A`
   - Fonts: Serif for headings (Playfair Display / Lora), Sans-serif for body (Inter / DM Sans)
5. Set up Supabase project (manual — create in Supabase dashboard)
6. Create `.env.local.example` with all required env vars
7. Create `.env.local` with actual keys
8. Run database migration (all tables — see schema below)
9. Create TypeScript types for all data models (`src/types/index.ts`)
10. Set up Supabase client helpers (`src/lib/supabase/client.ts`, `server.ts`, `admin.ts`)

## Database Schema (Full)

```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subject_name TEXT NOT NULL,
  subject_instagram TEXT,
  subject_tagline TEXT,
  photo_urls TEXT[],
  narrative TEXT NOT NULL,
  theme_tags TEXT[],
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  cover_image_url TEXT,
  category TEXT NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  venue_map_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  price_info TEXT,
  external_ticket_url TEXT,
  organizer_name TEXT,
  organizer_contact TEXT,
  organizer_instagram TEXT,
  status TEXT DEFAULT 'pending',
  submitted_by_email TEXT,
  is_trusted_submitter BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  photo_urls TEXT[],
  itinerary TEXT,
  duration TEXT,
  price_per_person INTEGER,
  max_group_size INTEGER,
  theme TEXT,
  whats_included TEXT,
  what_to_bring TEXT,
  guide_name TEXT,
  booking_whatsapp TEXT,
  booking_email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE newsletter_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  preview_text TEXT,
  content_json JSONB,
  html_content TEXT,
  featured_story_id UUID REFERENCES stories(id),
  sponsor_name TEXT,
  sponsor_image_url TEXT,
  sponsor_url TEXT,
  sponsor_text TEXT,
  status TEXT DEFAULT 'draft',
  beehiiv_post_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  birthday DATE,
  instagram_handle TEXT,
  beehiiv_subscriber_id TEXT,
  status TEXT DEFAULT 'active',
  source TEXT DEFAULT 'website',
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trusted_submitters (
  email TEXT PRIMARY KEY,
  approved_count INTEGER DEFAULT 0,
  auto_approve BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Verification

- `npm run dev` starts without errors
- Supabase connection works (can query tables)
- Brand colors render correctly in Tailwind
- shadcn/ui components render
