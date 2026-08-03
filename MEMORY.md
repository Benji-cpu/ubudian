# The Ubudian — Session Memory

Learned-experience notes that don't belong in CLAUDE.md. Keep entries concise (1–2 lines each); consolidate when this file approaches 200 lines.

## Reference template for cross-project standards (2026-05-05)

This project is the gold-standard reference for two cross-project features:

- **Feedback module** — `feedback` table schema (status enum `new|reviewed|resolved|dismissed`, type enum `bug|suggestion|general`), FAB + form + admin queue + status actions + Resend digest. Other Parallel Studio apps copy this shape.
- **Nightly cron pattern** — claude.ai remote trigger `trig_01CnuNJSs8m8wdVyeVrDHrKq` (17:19 UTC = 03:17 Bali) reads `.claude/agents/nightly-routine.md` and hits `/api/cron/daily-maintenance?digest=true` with `Authorization: Bearer ${CRON_SECRET}`. (Replaces the retired `.github/workflows/daily-maintenance.yml`.) See CLAUDE.md → "Trigger Maintenance". Other apps stagger their schedules ±5min from this.

When changing either, consider whether the change should propagate to MysTech, WordZoo, and The Programme.

## Ingestion pipeline gotchas

- Telegram file URLs are ephemeral — download immediately on receipt, don't store the URL for later.
- WAHA media downloads require `WAHA_API_KEY` auth header — easy to forget when testing locally.
- Adapter registration happens at module load via `registerAdapter()`. Adapters not imported in `src/lib/ingestion/adapters/index.ts` (the barrel) silently won't be available at runtime.
- The 4-layer dedup pipeline (URL → fingerprint → fuzzy → semantic) is implemented in `src/lib/ingestion/dedup.ts` and is reusable across other entity types.

## Daily-maintenance follow-ups

The nightly route does: **the editorial gate** (`auto-approve.ts` — the thing that actually publishes), archive past pending/approved events, purge failed messages, cancel stale bookings, archive fuzzy duplicates, link health + stale-CTA sweep, image GC, Telegram webhook health, build review queue.

Link health **is implemented** (`checkExternalLinkHealth` at `cleanups.ts:170`, wired at `daily-maintenance/route.ts`, three tests) — this file claimed otherwise until 2026-08-03. Still genuinely unbuilt:

- **Gemini spell-check pass** on `events.description` — flag suspicious content_flags or low quality_score.
- **Recurring event validation** — `recurrence_rule` has no `until` field, so expiries get smuggled in as free text ("until 2026-06-09") or as an RRULE `UNTIL=`. The editorial gate parses both and holds dead series; nothing repairs or normalises the rows.
- **Two `recurrence_rule` formats coexist in prod** — JSON (`{"frequency":"weekly"}`) and free text ("daily", "until …"). `parseRecurrenceRule` tolerates both; a normalising migration would let the gate stop guessing.

## Daily-maintenance + Supabase gotchas

- `daily-maintenance` route uses `createAdminClient()` (`SUPABASE_SERVICE_ROLE_KEY`) for cleanups. After rotating the service-role key in Vercel, the trigger still fires and `CRON_SECRET` auth still passes, but the route 5xxs partway through and the agent commits a stub `digests/YYYY-MM-DD.md` to `main`. Re-fire the trigger via `RemoteTrigger action: "run", trigger_id: "trig_01CnuNJSs8m8wdVyeVrDHrKq"` once the new key is live.
- The trigger sandbox blocks `*.vercel.app` — both the agent file and the trigger prompt are pinned to `https://theubudian.life`. Don't switch back to the Vercel host without also updating the trigger's egress allowlist (UI-only at https://claude.ai/code/scheduled).

## Testing

- Always kill Playwright Chromium after E2E runs: `pkill -f chromium || true` — no globalTeardown exists.
- Test login: `GET /api/auth/test-login` (regular user) or `?role=admin` (admin) — production-guarded.

## Beehiiv

- Distribution writes go through `lib/beehiiv.ts` (server-side); the Beehiiv MCP is read-only (analytics inspection).

## The failure mode this project keeps repeating (2026-08-03)

**Every automated pipeline here has, at some point, been left pointing at a human who wasn't there.**

- `pipeline.ts` inserted every event as `pending` "because the daily Claude approver is the editorial gate". That trigger was disabled 2026-05-20; the human routine replacing it stopped 2026-06-10. For eight weeks ~19 events/night landed in `pending` and **649 expired unpublished**. The site was showing 90 recurring rhythms and 10 upcoming one-offs while 230 good events sat in the queue.
- The nightly digest agent assumed GH Actions fires near its scheduled minute. It doesn't (60–95 min late, every day). 34 of 51 digests were false "payload missing" alarms, each one blaming a credential.
- The `/experiences/[slug]` route was repointed at `journeys` and five surfaces — including an outbound email — kept generating links for the old table.

When adding automation here, the test is: **if nobody looks at this for two months, what happens?** If the answer involves a queue, a review surface, or an inbox, it will silently fill and then silently expire. Prefer a gate that decides.

## Machine notes

- `.claude/settings.json` (the Stop hook running vitest) is **gitignored** — machine-local, not a repo guarantee.
- `npm test` is ~25s on an idle machine. Under load (a concurrent `next build`) vitest workers time out with "Failed to start forks worker" and report phantom failures — that's contention, not a regression. Re-run on a quiet machine before believing it.
- No `psql` on this Mac and `supabase db push` is unsafe here (the migration history is badly out of sync — ~50 local files have no remote row and vice versa). To apply one migration, run it directly with a `pg` client against `supabase/.temp/pooler-url` + `SUPABASE_DB_PASSWORD`, then insert the version into `supabase_migrations.schema_migrations` by hand.
