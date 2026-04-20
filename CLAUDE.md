# The Ubudian

Community media platform for Ubud, Bali — events, stories, tours, and a weekly newsletter.

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript
- **Database**: Supabase (Postgres + Auth + Storage)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Payments**: Stripe (tour bookings + membership subscriptions)
- **AI**: Gemini (`@google/generative-ai`) for event parsing, Stability AI for image generation
- **Newsletter**: Beehiiv (distribution), Resend (transactional email + ingestion alerts)
- **Scraping**: Cheerio (HTML parsing for web scrapers)
- **Forms**: Zod + React Hook Form + zodResolver
- **Testing**: Vitest + Testing Library (unit), Playwright (E2E)

## Commands

```bash
npm run dev        # Next.js (port 4000) + Telegram polling (concurrently)
npm run dev:next   # Next.js only (no TELEGRAM_BOT_TOKEN needed)
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Vitest (unit tests)
npm run test:watch # Vitest watch mode
npm run test:e2e   # Playwright E2E tests
```

## Deployment

- **Platform**: Vercel (Hobby plan)
- **Project**: `ubudian-v1`
- **Production URL**: https://ubudian-v1.vercel.app
- **Cron jobs** (2 — Hobby plan max):
  - `/api/cron/ingest-events` — daily at 6 AM UTC
  - `/api/cron/ingestion-health` — daily at 9 AM UTC
- **Images**: `unoptimized: true` (no Next.js Image Optimization)
- **Remote image hosts**: Unsplash, `*.supabase.co`, `api.telegram.org`

## Architecture

- `/src/app` — Pages and API routes (App Router)
- `/src/components` — `ui/` (shadcn), `admin/`, `auth/`, `blog/`, `dashboard/`, `events/`, `homepage/`, `layout/`, `membership/`, `newsletter/`, `quiz/`, `skeletons/`, `stories/`, `tours/`
- `/src/lib` — Core libraries:
  - `supabase/` — `server.ts`, `client.ts`, `admin.ts`, `middleware.ts`
  - `ingestion/` — Event ingestion pipeline (16+ files, see Ingestion section)
  - `stripe/` — `client.ts`, `server.ts`, `subscription.ts`, `helpers.ts`
  - `utils.ts`, `constants.ts`, `auth.ts`, `email.ts`, `beehiiv.ts`, `stability.ts`, `quiz-data.ts`, `quiz-helpers.ts`, `rate-limit.ts`, `recurrence.ts`
- `/src/types` — All TypeScript interfaces in `index.ts`
- `/supabase` — `schema.sql` (full database schema)
- `/e2e` — Playwright E2E tests
- `/scripts` — CLI utilities (Telegram setup, schema application, seeding)

**API route groups:**
- `webhooks/` — Stripe, Telegram, WhatsApp
- `cron/` — `ingest-events`, `ingestion-health`
- `checkout/` — `tour`, `subscription`
- `billing/portal` — Stripe customer portal
- `admin/ingestion/` — Sources, messages, venues, dedup, Telegram webhook management
- `events/` — `submit`, `approve`
- `newsletter/` — `subscribe`, `push-to-beehiiv`
- `images/generate` — Stability AI image generation (admin, rate-limited)
- `quiz/submit`

## Key Conventions

- Supabase server client for reads, browser client for mutations, admin client (service role) for API routes
- Forms: Zod schema + RHF + zodResolver pattern (see `blog-form.tsx` as template)
- Data fetching: `(data ?? []) as Type[]` pattern for arrays
- Slugs: auto-generated from title via `slugify()`, manually editable
- **Webhook routes use `after()` from `next/server`** to defer heavy processing (LLM parsing, Stripe handling) while returning 200 immediately — prevents timeout and retry storms
- **Webhook routes always return 200** even on processing errors (logged, not thrown) — prevents provider retry storms
- **Cron routes verify `Authorization: Bearer ${CRON_SECRET}`** — return 401 without it
- **API routes that modify data use `createAdminClient()`** to bypass RLS

## Brand

- **Colors**: deep-green `#2C4A3E`, gold `#C9A84C`, cream `#FAF5EC`, terracotta `#B85C3F`, charcoal `#2D2D2D`
- **Fonts**: Lora (serif headings), Source Sans 3 (body)
- **CSS vars**: `brand-deep-green`, `brand-gold`, `brand-cream`, `brand-terracotta`, etc.

## Database

19 tables across 4 domains. All have RLS enabled. `is_admin()` SQL function checks admin role.

**Content (8):** `profiles`, `blog_posts`, `stories`, `events`, `tours`, `newsletter_editions`, `newsletter_subscribers`, `trusted_submitters`
**Ingestion (6):** `event_sources`, `ingestion_runs`, `raw_ingestion_messages`, `venue_aliases`, `dedup_matches`, `unresolved_venues` — admin-only RLS (except `venue_aliases` has public read)
**Stripe (3):** `bookings`, `subscriptions`, `payments` — all amounts stored in **cents USD**
**User (2):** `quiz_results`, `saved_events`

Key gotchas:
- Trusted submitters auto-approve at **5 approved events** (`increment_approved_count()` SQL function)
- Public reads filtered by `status`/`is_active` per entity type
- `events` table has ingestion columns (`source_id`, `content_fingerprint`, `raw_message_id`, `llm_parsed`)

## Ingestion Pipeline

Automated event ingestion from multiple sources into pending events for admin review.

**Flow:** adapter fetches → LLM classifies (event vs non-event) → LLM parses structured data → 4-layer dedup (URL → fingerprint → fuzzy → semantic) → creates pending event

**Key files in `src/lib/ingestion/`:**
- `pipeline.ts` — Core orchestrator (`runIngestion()`)
- `llm-parser.ts` — Gemini-powered classification and parsing
- `dedup.ts` — Duplicate detection engine
- `venue-normalizer.ts` — Resolves venue aliases to canonical names (5-min cache)
- `source-adapter.ts` — Adapter registry (`registerAdapter()` / `getAdapter()`)
- `adapters/index.ts` — Side-effect imports that register all adapters

**Adapter pattern:** Each adapter calls `registerAdapter()` at module load. The `adapters/index.ts` barrel import triggers registration. Adapters must be imported there to be available at runtime.

**Ingested events always start as `pending`** — never auto-approved regardless of source.

## Webhooks

| Endpoint | Verification | Key gotcha |
|----------|-------------|------------|
| `/api/webhooks/stripe` | `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET` | Uses `after()` for background processing |
| `/api/webhooks/telegram` | `X-Telegram-Bot-Api-Secret-Token` header vs `TELEGRAM_WEBHOOK_SECRET` | Telegram file URLs are ephemeral — download immediately |
| `/api/webhooks/whatsapp` | `X-Webhook-Secret` header vs `WAHA_WEBHOOK_SECRET` | WAHA media downloads require `WAHA_API_KEY` auth header |

## Environment Variables

**Required (Supabase):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
**Required (Stripe):** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
**Required (AI):** `GEMINI_API_KEY`
**Required (Email):** `RESEND_API_KEY`
**Required (Cron):** `CRON_SECRET`

**Optional (Ingestion adapters):** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `WAHA_API_URL`, `WAHA_API_KEY`, `WAHA_WEBHOOK_SECRET`, `EVENTBRITE_API_KEY`, `MEETUP_API_KEY`, `SERPAPI_API_KEY`, `META_PAGE_ACCESS_TOKEN`, `INSTAGRAM_ACCESS_TOKEN`, `RETREAT_GURU_API_KEY`, `RAPIDAPI_KEY`, `ALLEVENTS_API_KEY`
**Optional (Other):** `STABILITY_AI_API_KEY`, `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`

## Testing

- **Unit:** Vitest + Testing Library. Config: `vitest.config.ts`. Tests in `src/lib/__tests__/`
- **E2E:** Playwright. Config: `playwright.config.ts`. Tests in `/e2e/`
  - Requires dev server running on port 4000 (`npm run dev` or `npm run dev:next`)
  - **Always kill Playwright browsers after test runs** (completed or failed): `pkill -f chromium || true` — no globalTeardown exists, so orphan Chromium processes accumulate
  - Audit subset: `npm run test:audit` (runs `e2e/audit/` with HTML reporter)
- **Test login**: `/api/auth/test-login` route — production-guarded, creates test users via Supabase admin client
  - `GET /api/auth/test-login` — signs in as regular user, redirects to `/`
  - `GET /api/auth/test-login?role=admin` — signs in as admin, redirects to `/admin`

## Front-End Verification

After implementing any front-end change, verify it using Playwright MCP:

1. Ensure dev server is running (`npm run dev:next` on port 4000)
2. Navigate to `/api/auth/test-login` (or `/api/auth/test-login?role=admin` for admin pages) to get a logged-in session
3. Navigate to the affected pages
4. Take screenshots and visually review the result
5. Test on both mobile (390px) and desktop viewports

This applies to: new pages, component changes, layout changes, style changes, and any feature with a UI component.

## MCP Servers

Configured in `.mcp.json` (project-level):

| Server | Transport | Purpose |
|--------|-----------|---------|
| Supabase | HTTP | Schema queries, RLS debugging, data inspection (read-only) |
| Stripe | HTTP | Payment debugging, subscription management, webhook inspection |
| WAHA | stdio (npx) | WhatsApp message management for ingestion pipeline |
| Vercel | stdio (npx) | Deployment monitoring, build logs, env vars, project settings |
| Beehiiv | stdio (npx) | Subscriber analytics and management (read-only; writes use `beehiiv.ts`) |

Global MCPs also available: Playwright (E2E testing), GitHub (PR/issues), Context7 (docs lookup).

## Important Notes

- Event submission API (`/api/events/submit`) uses admin client — anon RLS can't insert events
- Image uploads go to `images` bucket with folder prefix (`blog/`, `stories/`, `events/`, `tours/`)
- Stories route: `/stories` (nav says "Humans of Ubud")

**Status workflows by entity:**
- **Events:** `pending` → `approved` / `rejected` → `archived`
- **Blog posts / Stories:** `draft` → `published` → `archived`
- **Tours:** `is_active` boolean (no status workflow)
- **Newsletter editions:** `draft` → `published` → `archived` (with `sent_at` timestamp)
- **Bookings:** `pending` → `confirmed` → `completed` / `cancelled` / `refunded`
- **Subscriptions:** `incomplete` → `active` / `trialing` → `past_due` / `canceled` / `unpaid`

## Self-Verification

Before declaring work complete:

**Back-end / pipeline changes:**
```bash
npm test                                           # Full unit test suite
npx vitest run src/lib/__tests__/ingestion/        # Ingestion tests only
```
- All tests must pass. Do not skip or `.todo()` failing tests.
- The Stop hook in `.claude/settings.json` runs `npm test` automatically — if it fails, fix the issue before continuing.
- Use Supabase MCP (`.mcp.json`) to verify database state after pipeline changes.

**Front-end changes:**
- Use Playwright MCP to navigate to affected pages and take screenshots
- Verify on both desktop and mobile (390px) viewports
- Use `/api/auth/test-login` for authenticated pages (append `?role=admin` for admin pages)

## Claude Autonomy & DB Workflow

Claude is pre-authorized to apply migrations and mutate production Supabase directly via MCP. The safety net is discipline around *how* changes are made, not permission prompts.

### Always
- **Write a migration file first.** Every schema change (DDL) and any data change touching >10 rows must live in `supabase/migrations/<timestamp>_<name>.sql` before being applied. This gives a git-reviewable audit trail of every DB mutation.
- **Preview before apply.** For any data mutation, run a `SELECT COUNT(*)` with the same WHERE clause first and report the row count. If it's surprising, stop.
- **Apply via `mcp__supabase__apply_migration`** (preferred) or `npx supabase db push` for bulk local flushes. Do not run ad-hoc `execute_sql` writes when a migration file would work.
- **Verify after apply** with a read-only MCP query and a front-end Playwright check if the change is user-visible.

### Ask first (even though the tool is technically allowed)
- **DROP TABLE / TRUNCATE / DELETE without WHERE** — irreversible.
- **Any change touching >500 rows in prod** — use a Supabase branch instead (create_branch → apply → verify → merge_branch). If the cost of being wrong is high, isolate first.
- **Rotating or revoking API keys, webhook secrets, Stripe webhooks** — shared external state.
- **Deleting a Supabase branch that isn't one Claude just created** — might be the user's in-progress work.

### Never (without an explicit, same-session instruction from the user)
- Force-push to main.
- Delete user data (profiles, bookings, subscriptions) for reasons other than a specifically requested cleanup.
- Disable RLS on a table.
- Share secrets (service role keys, Stripe live keys, webhook secrets) outside the local machine — never paste into chat, external tools, or PR descriptions.
