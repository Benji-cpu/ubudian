# The Ubudian

The calendar for Ubud's conscious community — ceremonies, ecstatic dance, breathwork, sound journeys, tantra and the rest of what actually happens in the valley each week.

Live at **[theubudian.life](https://theubudian.life)**.

The scene's own research (`docs/superpowers/research/2026-05-07-ubud-community-ethnography.md`) put the gap plainly: listings are scattered across Megatix, Eventbrite, AllEvents, a hundred Instagram accounts and a dozen WhatsApp groups, and *"there's no single calendar that combines studio classes + facilitator workshops + closed-circle openings."* That's the job.

## How it runs itself

The point of this codebase is that nobody has to sit in front of it. Events arrive, get screened, and go live without a human in the loop:

```
harvesters ──▶ ingestion pipeline ──▶ status='pending' ──▶ editorial gate ──▶ live
(GH Actions,    (dedup, venue                              (nightly, inside
 Claude curator) normalisation,                             daily-maintenance)
                 geocoding, ICP filter)
```

- **Harvest** — three scheduled GitHub Actions workflows (`todo-today-harvest`, `aggregator-harvest`, `tag-embed-sweep`) plus a Claude Code remote agent (`.claude/agents/daily-curator.md`) that walks curated sources nightly. Roughly 19 candidate events a night.
- **Screen** — `src/lib/maintenance/auto-approve.ts`. A free structural pass (real venue, real category, body length, parser flags, quality score, live recurrence, future date), then the Gemini safety gate on whatever survives. Publishes up to 25 a night, stamps `auto_approved_at` on each so the whole thing reverses with one `UPDATE`, and holds anything it isn't sure about. **Nothing it declines creates work** — held events simply expire, because a review queue is a chore and chores don't get done.
- **Report** — a second remote agent (`.claude/agents/nightly-routine.md`) writes `digests/YYYY-MM-DD.md` to `main` each night.

Dry-run the gate any time without writing:

```bash
npx tsx scripts/auto-approve.ts --limit=250      # add --apply to publish
```

## Getting started

```bash
npm install
# fill in .env.local — see "Environment" below
npm run dev                        # http://localhost:4000
```

`npm run dev` also starts Telegram polling; use `npm run dev:next` if you don't have `TELEGRAM_BOT_TOKEN` set.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Next.js on **port 4000** + Telegram polling |
| `npm run dev:next` | Next.js only |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests (52 files, ~620 tests, ~25s) |
| `npm run test:e2e` | Playwright — needs the dev server on :4000 |
| `npm run test:audit` | The `e2e/audit/` subset with an HTML report |

Kill orphaned browsers after E2E runs: `pkill -f chromium || true` (there is no globalTeardown).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Supabase (Postgres + Auth + Storage) · Tailwind CSS 4 + shadcn/ui · Stripe · Gemini for parsing and moderation · Resend for transactional mail · Beehiiv for the newsletter · Vercel.

## Layout

```
src/app/             pages + API routes. Section indexes live in an (index)
                     route group so their loading.tsx doesn't wrap [slug] —
                     that boundary was turning every 404 into a 200.
src/lib/ingestion/   the harvest pipeline: adapters, dedup, LLM parsing
src/lib/maintenance/ the nightly cleanups + the editorial gate
src/lib/events/      Bali-time handling, recurrence, ranking, filtering
supabase/            schema.sql + migrations/
.claude/agents/      the two remote agents that run nightly
curator/             the curator's sources, playbook, logs and inbox
digests/             nightly maintenance reports, committed by the agent
```

## Environment

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `GEMINI_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`.

Everything else is optional and gates a specific feature — see the full table in `CLAUDE.md`.

## Contributing

`CLAUDE.md` is the working agreement: conventions, the cron table, the DB workflow, and what ships directly to production (all of it — there are no PRs in this repo).
