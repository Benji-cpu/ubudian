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

The nightly route currently does: archive past pending events, purge failed messages, cancel stale bookings, archive fuzzy duplicates, build review queue. The following are planned but not implemented — extend `src/lib/maintenance/cleanups.ts` and reference from `daily-maintenance/route.ts`:

- **Link health check** on `events.external_ticket_url` and `venues.map_url` — flag 4xx/5xx responses, surface in review queue.
- **Gemini spell-check pass** on `events.description` — flag suspicious content_flags or low quality_score for re-review.
- **Recurring event validation** — parse `recurrence_rule` (iCal RRULE), surface orphaned instances and rules expiring within 14 days.

## Daily-maintenance + Supabase gotchas

- `daily-maintenance` route uses `createAdminClient()` (`SUPABASE_SERVICE_ROLE_KEY`) for cleanups. After rotating the service-role key in Vercel, the trigger still fires and `CRON_SECRET` auth still passes, but the route 5xxs partway through and the agent commits a stub `digests/YYYY-MM-DD.md` to `main`. Re-fire the trigger via `RemoteTrigger action: "run", trigger_id: "trig_01CnuNJSs8m8wdVyeVrDHrKq"` once the new key is live.
- The trigger sandbox blocks `*.vercel.app` — both the agent file and the trigger prompt are pinned to `https://theubudian.life`. Don't switch back to the Vercel host without also updating the trigger's egress allowlist (UI-only at https://claude.ai/code/scheduled).

## Testing

- Always kill Playwright Chromium after E2E runs: `pkill -f chromium || true` — no globalTeardown exists.
- Test login: `GET /api/auth/test-login` (regular user) or `?role=admin` (admin) — production-guarded.

## Beehiiv

- Distribution writes go through `lib/beehiiv.ts` (server-side); the Beehiiv MCP is read-only (analytics inspection).
