# The Ubudian

The calendar for Ubud's conscious community: ceremonies, dance, breathwork and sound, gathered and screened every night with no person in the loop. It also carries venue deals, guides and a weekly email. Stories, tours, the blog and the newsletter archive are switched off in `site_settings`.

- **Lead chat:** Ubudian · Master (`local_9d030459-f834-4609-8ece-622f9de9d479`), opened in the `Code` folder, sidebar group "Ubudian 🌴". It owns deals, email, Instagram and the site. The current plan is `Code/handovers/2026-11-08-ubudian-breakthrough.md`.
- **Live at:** https://theubudian.life (Vercel project `ubudian-v1`, Hobby plan). Other hosts redirect to it.
- **Repo:** `Benji-cpu/ubudian`, branch `main`. A push to `main` deploys to production.
- **Stack:** Next.js 16, Supabase (Postgres, Auth, Storage), Tailwind 4 with shadcn/ui, Stripe (tour bookings only), Gemini `gemini-2.5-flash-lite` through `@google/genai` (free tier: 20 requests a day per model), Resend for all email, sent from `hello@theubudian.life` (the only verified domain).
- **Run by AI only** (Ben, 16 Oct 2026): nothing depends on Ben walking in, signing up or sending by hand.

## Commands

- `npm run dev:next` (port 4000, no Telegram token needed), `npm run dev` (adds Telegram polling), `npm run build`, `npm run lint`, `npm run test` (Vitest), `npm run test:e2e` (Playwright; needs the dev server on 4000).
- Test login: `/api/auth/test-login`, or `?role=admin` for admin pages. Off in production.
- Database changes: write a file in `supabase/migrations/`, then apply it with `npx tsx --env-file=.env.local scripts/apply-migration.ts <file>`. `supabase/schema.sql` is a generated snapshot.

## How it runs

- Vercel Cron has 2 slots and both are used: `ingest-events` at 17:00 UTC and `ingestion-health` at 09:00 UTC. Everything else runs in GitHub Actions, which fire 60 to 95 minutes late, or as a Claude routine.
- The editorial gate is `src/lib/maintenance/auto-approve.ts`, run nightly inside `daily-maintenance`. There is no human approver.
- Live event sources: Telegram, todo.today, Megatix, submissions, and the events desk (private repo `Benji-cpu/ubudian-events-bus`). The deals review runs from the private repo `Benji-cpu/ubudian-deals-bus`.
- The weekly email goes out Tuesday 23:06 UTC to `newsletter_subscribers` and to profiles. There is no Beehiiv.
- Instagram is @theubudianlife. Ben's standing yes for personal DMs runs to 15 Dec 2026 (see the `Code` memory).

## Older notes

`docs/claude-md-2026-11-10.md` is this file as it was before 10 Nov 2026 (the full job table, database map, env vars, ingestion pipeline). Look a fact up there; its rules no longer apply.
