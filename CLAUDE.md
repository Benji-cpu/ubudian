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
- **Production URL**: https://theubudian.life (canonical apex; old `ubudian-v1.vercel.app` and `www.theubudian.life` 308-redirect to it via `src/middleware.ts` host-canonicalization — webhooks and `/api/cron/*` are exempt). Always reference `theubudian.life` in copy, env vars (`NEXT_PUBLIC_SITE_URL`), screenshots, and docs.
- **Cron jobs**:
  - `/api/cron/ingest-events` — Vercel Cron, daily at 6 AM UTC. Lands events as `pending`.
  - `/api/cron/ingestion-health` — Vercel Cron, daily at 9 AM UTC
  - `/api/cron/daily-maintenance` — Claude remote trigger `trig_01CnuNJSs8m8wdVyeVrDHrKq` at `17 19 * * *` UTC (≈03:17 WITA). Agent: `.claude/agents/nightly-routine.md`.
  - **Daily curator** — Claude trigger `trig_01637DsCbz5qGn6r5RTP4hhi` at `47 19 * * *` UTC (≈03:47 WITA). Agent: `.claude/agents/daily-curator.md`. Discovers + ingests dance/tantra events into `pending`.
  - **Daily event approver** — Claude trigger `trig_015VbLdAh4G8Wpz1hscSvRtC` at `52 19 * * *` UTC (≈03:52 WITA). Agent: `.claude/agents/daily-event-approver.md`. Walks the `pending` queue with Claude Sonnet judgement, approves / archives / escalates. Replaces the in-flight Gemini moderation gate. Commits `curator/approvals/YYYY-MM-DD.md` to main.
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

**Optional (Ingestion adapters):** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `WAHA_API_URL`, `WAHA_API_KEY`, `WAHA_WEBHOOK_SECRET`, `EVENTBRITE_API_KEY`, `MEETUP_API_KEY`, `SERPAPI_API_KEY`, `META_PAGE_ACCESS_TOKEN`, `INSTAGRAM_ACCESS_TOKEN`, `RETREAT_GURU_API_KEY`, `RAPIDAPI_KEY`, `ALLEVENTS_API_KEY`, `APIFY_API_TOKEN`
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

## Worktree & Branch Hygiene

This project is in **direct-to-production mode** — no long-running speculative branches, no PRs anywhere (interactive or scheduled). See master `Code/CLAUDE.md` "Shipping Standard." Scheduled routines commit and push their output directly to `main`; they do not open draft PRs. Every session must end with `main` clean.

- Before stopping: `git worktree list` shows only the main worktree, `git status` is clean, and `git branch --no-merged main` is empty.
- Subagents that use `Agent({ isolation: "worktree" })` create worktrees under `.worktrees/` or `.claude/worktrees/`. Empty worktrees are auto-removed by the runtime; populated ones are not — close them out before session end via `git worktree remove <path>` after merging or discarding.
- Prefer working on a single feature branch and merging it before starting the next. Avoid juggling 3+ open feature branches.
- For tiny tweaks (color, copy, single-file fix), commit on `main` directly — auto-push handles the rest.
- If a branch can't be finished this session: either commit the WIP and push to remote so it's not lost, or delete the branch outright. Never leave uncommitted files in a worktree across sessions.

## Trigger Maintenance

The nightly `daily-maintenance` agent runs as a **claude.ai remote trigger**, editable from any Claude Code session via the `RemoteTrigger` deferred tool (load with `ToolSearch select:RemoteTrigger`). The previous assumption that triggers are claude.ai-UI-only is wrong.

**Architecture: GH Actions ferries data, Claude trigger synthesises.** Anthropic's sandbox egress allowlist blocks `theubudian.life` and `*.vercel.app` (anthropics/claude-code#41565), so the trigger does not call Vercel directly. Instead, the GitHub Actions workflow `.github/workflows/daily-maintenance-fetch.yml` runs at 19:02 UTC, curls `/api/cron/daily-maintenance?digest=true` from GH's runners (which have unrestricted egress), and commits the JSON response to `digests/YYYY-MM-DD.json` on `main`. The Claude trigger fires 15 minutes later at 19:17 UTC, pulls main, reads the JSON, synthesises the markdown digest, and commits `digests/YYYY-MM-DD.md`. GitHub is the message bus. (The 15-minute gap absorbs GH cron drift — first scheduled run on 2026-05-06 fired 40 minutes late, which left the Claude agent staring at a missing JSON. Off-minute `02` and 15-minute slack both dodge the quarter-hour pile-up.)

| Field | Value |
|-------|-------|
| Trigger ID | `trig_01CnuNJSs8m8wdVyeVrDHrKq` |
| Name | `Ubudian — daily maintenance digest` |
| Cron | `17 19 * * *` UTC (≈03:17 Bali / WITA) |
| Environment | `env_013bqn65fNb8N1mWyLSMV78w` (Default — anthropic_cloud) |
| Repo | `https://github.com/Benji-cpu/ubudian` |
| Model | `claude-sonnet-4-6` |
| Agent file (source of truth) | `.claude/agents/nightly-routine.md` |
| Upstream data source | GH Actions workflow `daily-maintenance-fetch.yml` (cron `2 19 * * *`) writes `digests/YYYY-MM-DD.json` to `main` |
| Network reach needed | `github.com` only (no HTTP egress to Vercel/Supabase/Resend from the trigger) |

The trigger prompt is a **thin shim**: it points the agent at `.claude/agents/nightly-routine.md` and reminds it that the GH workflow has already produced the JSON payload it needs to read. The agent does **not** receive `CRON_SECRET` — that secret only lives in Vercel and in GH repo secrets. The trigger DOES seed `GITHUB_PAT` (a fine-grained PAT with `Contents: read/write` on `Benji-cpu/ubudian` and any sister repos used as a cross-app bus). The agent uses it as `GH_TOKEN` for two things: (a) self-healing the GH workflow when it drifts past the 15-minute slack window, and (b) any future cross-repo updates. Rotate the PAT via https://github.com/settings/tokens, then `RemoteTrigger update` the seed line. **Never** paste the PAT into chat, commits, or PR bodies. If you change the agent file's behaviour (input source, output format), reconcile the seed-context lines in the trigger prompt too.

**Common operations:**

```text
RemoteTrigger { action: "list" }                                    # find all triggers
RemoteTrigger { action: "get",  trigger_id: "trig_01CnuNJSs8m8wdVyeVrDHrKq" }
RemoteTrigger { action: "run",  trigger_id: "trig_01CnuNJSs8m8wdVyeVrDHrKq" }   # fire ad-hoc
RemoteTrigger { action: "update", trigger_id: "trig_01CnuNJSs8m8wdVyeVrDHrKq",
                body: { cron_expression: "17 19 * * *" } }          # partial update
```

`RemoteTrigger` cannot delete — for that, visit https://claude.ai/code/scheduled/trig_01CnuNJSs8m8wdVyeVrDHrKq.

**Failure playbook** (in order of likelihood, based on observed runs):

1. **JSON payload missing on main** (`digests/${TODAY}.json` not present when trigger fires) — the GH workflow `daily-maintenance-fetch` either didn't run, ran late, or failed. Check `gh run list --workflow=daily-maintenance-fetch.yml --limit 5`. The agent now self-heals: it waits 60s, retries `git pull`, and if still missing dispatches the workflow itself via `gh workflow run` (using the seeded `GITHUB_PAT`), waits up to 5 min, then retries. Only if the self-heal also fails does it commit a `payload missing (self-heal failed)` stub. Common causes for the self-heal-failed state: PAT expired or wrong scopes, `CRON_SECRET` rotated in Vercel but not in GH repo secrets, Vercel route 5xxing.
2. **5xx from the Vercel route** (visible inside the GH Actions run logs) — the route is partly fault-tolerant; a 5xx means an uncaught failure (Supabase down, link-health hammered, etc.). The GH workflow turns red and no JSON is committed → cascades into failure mode #1. Investigate the route; re-fire the GH workflow via `gh workflow run daily-maintenance-fetch.yml` once it's healthy.
3. **`CRON_SECRET` mismatch** (401 from the route in GH Actions logs) — `CRON_SECRET` rotated in Vercel without updating the GH repo secret. Run `gh secret set CRON_SECRET --repo Benji-cpu/ubudian` to re-sync, then re-fire the workflow. Never paste the secret into commits or chat.
4. **Sandbox blocks the trigger itself (no commit lands)** — check the run history at https://claude.ai/code/scheduled/trig_01CnuNJSs8m8wdVyeVrDHrKq. If the sandbox killed the run before any output, the JSON should still be on main from the GH workflow — investigate the trigger separately and re-fire via `RemoteTrigger action: "run"` once the underlying issue is fixed.

**Historical note:** Before 2026-05-06 this trigger called the Vercel route directly. That broke when Anthropic's sandbox egress allowlist rejected `theubudian.life`. Failed-run audit trail: commits 4a50d05 and 7d4109f. The git-as-bus refactor moved the HTTP egress into GH Actions, where it's been reachable all along.

Sister triggers (same family, different repos): MysTech `trig_01TKZ5AcWYUjmXPffoRd1qaz` (19:22 UTC), WordZoo `trig_01Dnx4XZjFoduw1SEfio9vPy` (19:32 UTC), The Programme `trig_01QaE3psDNRrhF51N6UFSey6` (19:07 UTC), CC Mastery `trig_01FRSrj9oJguHBmUhnhhmBbJ` (20:17 UTC).

## Daily Curator Trigger

Separate trigger from `daily-maintenance` — runs an AI curator that discovers and ingests dance + tantra + ceremony events daily. See `.claude/agents/daily-curator.md` for the agent spec and `curator/playbook.md` for the vibe filter rules. Same git-as-bus architecture as `daily-maintenance`: agent writes `curator/inbox/YYYY-MM-DD.json` to main → GH Actions workflow `.github/workflows/curator-ingest.yml` POSTs to `/api/cron/curator-ingest` → route runs each event through `createEventFromParsed()` and forces `status='pending'`.

| Field | Value |
|-------|-------|
| Trigger ID | `trig_01637DsCbz5qGn6r5RTP4hhi` |
| Name | `Ubudian — daily curator (dance + tantra)` |
| Cron | `47 19 * * *` UTC (≈03:47 Bali, 30 min after `daily-maintenance`) |
| Environment | `env_013bqn65fNb8N1mWyLSMV78w` (Default — anthropic_cloud) |
| Model | `claude-sonnet-4-6` |
| Repo | `https://github.com/Benji-cpu/ubudian` |
| Agent file | `.claude/agents/daily-curator.md` |
| State | `curator/sources.json`, `curator/playbook.md`, `curator/log/`, `curator/inbox/` |
| Vercel route | `/api/cron/curator-ingest` (POST, `CRON_SECRET` Bearer auth) |
| Source row | `event_sources.slug = 'curator'` with `_preParsed=true`, `_skipClassification=true` |

Common operations:

```text
RemoteTrigger { action: "run",    trigger_id: "trig_01637DsCbz5qGn6r5RTP4hhi" }   # fire ad-hoc
RemoteTrigger { action: "get",    trigger_id: "trig_01637DsCbz5qGn6r5RTP4hhi" }
RemoteTrigger { action: "update", trigger_id: "trig_01637DsCbz5qGn6r5RTP4hhi", body: { enabled: false } }  # pause
```

Run history at https://claude.ai/code/scheduled/trig_01637DsCbz5qGn6r5RTP4hhi.

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
