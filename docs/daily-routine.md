# Ubudian — daily routine prompt

Copy everything below the `---` divider and paste into Claude Code at the start of a session. The prompt is open-ended on purpose — it sets the goal and constraints, then trusts you to think and act.

**This file is meant to evolve.** Last section ("Prompt evolution") is the agent's instruction to propose updates back to this file when it spots patterns. Don't expect this prompt to stay frozen.

---

You are running The Ubudian's daily operations routine — event ingestion, pending-queue triage, user-feedback review, site spot-checks, and any small fixes the day surfaces. The site (https://theubudian.life) is a community media platform for Ubud — events, stories, tours, curated retreats — and your job today is to make the live agenda great, action the user feedback that came in overnight, push fixes to production, surface improvements I should care about, and propose an update to this prompt if you noticed something it should teach future-you.

**You have direct access to Supabase (MCP), Vercel, Playwright, and the repo. Use them. Don't ask permission for routine reads. For writes, run the write — `git push origin main` is fine without me confirming each time.** This project ships direct-to-production. No PRs. Commit on main and push.

## Context to load first

1. `/Users/benji-m4/.claude/projects/-Users-benji-m4-Documents-Code-The-Ubudian-ubudian-v1/memory/project_event_pipeline_overview.md` — what runs overnight, in what order, and which signals to read.
2. The three overnight artifacts on `main`:
   - `digests/$(TZ=Asia/Makassar date +%F).md` — maintenance digest
   - `curator/log/$(TZ=Asia/Makassar date +%F).md` — what the curator discovered
   - `curator/approvals/$(TZ=Asia/Makassar date +%F).md` — what the approver did (or BLOCKED-stub if it failed)
3. Brand register: lush, restrained, editorial — Aman / COMO / National Geographic. Audience: conscious-community / tantra / ecstatic-dance / contact-improv / cacao / breathwork scene for Ubud expats. NOT tourist-coded. Memory file: `feedback_lush_not_hippie.md`. **Token gotcha:** `text-brand-cream` and `text-brand-deep-green` invert in dark mode (they're foreground tokens). Sections with `bg-gradient ... dark:from-...` (events hero, home canopy) need literal hex (`text-[#FAF5EC]`, `text-[#2C4A3E]`) — if a screenshot shows invisible text on a known-dark gradient, this is the first suspect. See `project_brand_var_inversion_on_locked_hero.md`.
4. Last 5 entries of `docs/daily-routine-log.md` — your memory of recent runs, things you learned, follow-ups still owed. (If the file doesn't exist, you're the first run — start it.)

## The work — do all of it, in roughly this order

**1. Read the overnight.** Summarise in 3-4 sentences: how many events ingested, how many approved, how many archived, what the curator discovered, whether anything broke. If the approver committed a BLOCKED stub, walk the queue yourself — that's the recovery path.

**2. Drive the pending queue to zero.** Query `events WHERE status='pending'`. For each, decide approve / archive_off_topic / archive_dup / repair-then-approve, and **apply the UPDATEs directly via Supabase MCP**. Don't punt to admin queue. Don't write JSON files. Just do the work. Target volume on a normal day: 10-30 events approved. Conscious-community gatherings (dance, tantra, ceremony, sound, breathwork, cacao, contact improv, circles, retreats, kids art, family paint) → live. Tourist crap (bar crawls, ATV, monkey forest, chain yoga, day-trip tours) → archived with `moderation_reason='ai_approver_off_topic_<TODAY>'`. Duplicates → archived with `dup_of=<canonical>`. Repair fields where the description gives you an unambiguous fix (start_time from a description quote, bare-domain URLs, junk venue strings).

> **Since 2026-06-03 the GH-Actions harvests (ToDo.Today 02:30 + Megatix 02:40 + Telegram webhook) feed pending nightly, so the queue is now SOURCE-TAGGED and larger** (a fresh queue ran ~85; steady-state ~15-40 after dedup). Triage by source: **`todo-today`** is clean ICP (approve most). **`megatix`** is mostly The Yoga Barn / Sayuri — APPROVE the gatherings (ecstatic dance, sound bath/journey, breathwork, kirtan, cacao, men's/women's circles, somatic/dance journeys) but ARCHIVE off-topic the venues' *retail program*: face yoga / gua sha / facial-anatomy (beauty), osteopathy / abdominal-release / hormone-or-cycle clinics, teacher-trainings / masterclasses / Nhr courses, comedy & stand-up, self-help ("impostor syndrome", "overthinking", "reinventing yourself"), language classes, restaurant "live music night". (The harvester now pre-drops most of these; flag any new class you archive so it can be added to `scripts/scrape/megatix-harvest.mjs`'s `NEGATIVE`.) **`telegram`** is LLM-parsed messages — watch for professional trainings + business circles. **Cross-source dups are the #1 thing to catch**: the same recurring event arrives from megatix + todo-today + telegram under *different titles* (e.g. "FRIDAY Ecstatic Dance" = our Friday ED; "5Rhythms Moving Wave" = our Moving Waves; "DISSOLVE EROS" ×3) and the fingerprint dedup misses title variants — archive_dup against the canonical. Write the day's decisions as a `supabase/migrations/<ts>_daily_routine_<date>.sql` (archive lists + a final `UPDATE … SET status='approved' WHERE status='pending'`).

**3. Action user feedback.** Query the `feedback` table (Ubudian's legacy name for `app_feedback`) for rows with `status='new'`. Each row carries `type`, `message`, `email`, `page_url`, `page_title`, `viewport_width/height`, `route_params`, `activity_trail` (last ~80 events tagged route/click/fetch/error — read this when the message is vague; it tells you what the user was doing), and `image_url` (a screenshot of `<main>` captured by html2canvas). For each:

- Read the message + activity trail together. The trail usually reveals the actual problem better than the message does.
- If the report is a bug you can fix in <10 minutes (broken link, wrong copy, mobile overflow, dark-mode invisibility, stale date), fix it now and ship it with the rest of today's commits.
- If it's a feature request or a non-trivial bug, capture it as a follow-up under "What needs your call" and move on.
- Always update the row: `status='actioned'` if you fixed or shipped a change, `status='dismissed'` if it's spam/duplicate/out-of-scope, `status='reviewed'` if you read it but neither shipped nor dismissed (e.g. waiting on Benji). Add a one-line `admin_notes` on every update so the audit trail explains what happened.
- Skim `/admin/app-feedback` once if the volume looks off — the floating button on every authed page is the inbound channel, and a sudden spike usually means something visible broke.

**4. Audit the live agenda.** Open `https://theubudian.life/events` via Playwright on desktop + 390px mobile. Today's date's events should be at the top, prominent, with correct times. No stale March dates leaking. No off-brand entries visible. Take screenshots, flag visual issues.

**5. Spot-check event data integrity.** Pick a representative sample — ~5-8 events spread across `today`, `this weekend`, `next week`, and one multi-day. For each, this systematic cross-check (treat any mismatch as a bug worth fixing this morning, not just noting):

- **Card vs detail page.** Click through from the agenda to the event detail page. Does the date shown on the card match the date on the detail page? Does the time match? Venue, organiser, price? Mismatch usually means a render layer is reading raw DB values instead of the rolled-forward instance — fix at the source.
- **External link health.** Hit `external_ticket_url` and `venue_map_url` (HEAD request is fine). 404/403 → log, repair if obvious (bare-domain → prepend `https://`), archive if the listing is genuinely dead.
- **Recurring sanity.** For events with `is_recurring=true`, verify the next-occurrence date the card shows actually falls on the rule's `day_of_week`. A weekly Monday event should never display a Wednesday date.
- **Past-date leakage.** Anything in the agenda whose `start_date` is < today (Bali) and isn't multi-day-in-progress is a bug. Don't archive blindly — figure out *why* it's surfacing (rolled wrong? rule null?) and fix the rendering.
- **Brand voice.** Read the actual description copy on 2-3 events. If the title is good but the description is chakra-soup or tour-operator-speak, decide: rewrite the short_description (you have authority), or archive and let the source self-correct.

These checks are *systematic*, not bug-of-the-day. Pick a different 5-8 events each morning so over a week you've audited 30-50 distinct events. When the same class of issue appears twice in a week, treat it as a code-level bug and fix it at the rendering / pipeline layer instead of patching individual rows.

**6. Hunt new venues + facilitators.** Look at `curator/sources.json.discovered_pending` and `.facilitators_pending`. Anything appearing in ≥3 recent curator logs gets promoted to `priority_b`. Search for venues/facilitators we might be missing — Ubud's conscious-community scene moves fast. Append discoveries to `discovered_pending`. Don't just collect; propose 1-3 specific new sources to add this week.

Also sweep the **full competitor-harvest bucket** in `sources.json.competitor_harvest` for venues + facilitators we don't yet track — that bucket is the authoritative scout list (currently spans API-direct aggregators like Blissbase + Soulwise, HTML-walked aggregators like BaliSpirit / BaliBuddies / AllEvents.in / Cool Destinations / NOW! Bali / ubud.app / NuMundo, Cloudflare-walled ToDo.Today, three Facebook channels routed via the `facebook.ts` / `apify-instagram.ts` adapters, and the ShambAllah WhatsApp curator channel routed via `whatsapp.ts` once joined). Anything that surfaces across ≥2 scouts goes straight to `discovered_pending`. **The URL rule, repeated because it matters:** aggregator and scout-channel URLs (blissbase.app, soulwise.io, todo.today, ubud.app, balispirit.com, balibuddies.com, allevents.in, cooldestinations.com, nowbali.co.id, numundo.org, facebook.com groups/pages, WhatsApp invite links) **never** land in `external_ticket_url` or `source_url`. Only ticket-direct URLs (Megatix, Eventbrite, Ticket Tailor, Lu.ma, venue-owned ticketing) are captured; otherwise leave both URL fields `null` and the card renders without a CTA. That is correct behaviour — sending users to a competitor would be worse. See `curator/playbook.md` "Competitor harvest — attribution rules" for the canonical forbidden-domain list and `.claude/agents/daily-curator.md` Step 3b for per-scout fetch paths. **Two priority follow-ups for this routine:** (a) skim the ShambAllah WhatsApp invite-link chase — it's the single highest-value scout we don't yet ingest; (b) when source volume is thin, hand-skim the three Ubud FB community channels (Ubud Conscious Community ~25k, Ubud Events, Ubud Dance Community) for anything the adapters missed.

**6b. Harvest engine — cross-check it, then grow the web.** The source web is meant to *compound*, not sit static. As of 2026-06-02 the richest aggregator, **ToDo.Today, is auto-harvested daily** (`.github/workflows/todo-today-harvest.yml` runs `scripts/scrape/todo-today-harvest.mjs` → POST `/api/cron/curator-ingest?source=todo-today` → `pending`, ~12-15 ICP events/day *with correct cover images*). Your job is to **cross-check, not depend**:

- **MANUALLY RUN BOTH HARVESTERS YOURSELF every routine — don't just trust the overnight automation.** `node scripts/scrape/megatix-harvest.mjs --out /tmp/mega.json` and `node scripts/scrape/todo-today-harvest.mjs --out /tmp/todo.json`, then eyeball the output: sensible event count, **every event has a `start_time` and (todo) a `cover_image_url`**, titles are ICP, no junk/wrong-location leaked. **If anything is broken — a harvester erroring, a workflow run red (`gh run list --workflow=…`), times or images missing, a 504 on POST, a new noise pattern — FIX IT YOURSELF ON THE SPOT** (the scraper, the parser, the workflow, a migration, a backfill) and ship it in today's commit. The harvesters are live code that the real-world data keeps stress-testing; treat finding-and-fixing their breakage as core routine work, not an escalation. *Examples of fixes found this way: the Megatix `start_datetime` was space-separated not "T"-separated so `.split("T")` silently dropped every time (2026-06-08); the ToDo POST 504'd unchunked once the agenda grew (2026-06-04); the `"Mas"` locality `.includes()` matched inside "massage" and leaked Lombok events.* When you fix a harvester, backfill the rows already affected (e.g. `node scripts/backfill-megatix-times.mjs`).
- **Verify the overnight run landed.** `SELECT count(*) FROM events e JOIN event_sources s ON s.id=e.source_id WHERE s.slug='todo-today' AND e.created_at::date = '<today-WITA>'`. Zero on a normal day = the GH workflow failed (check `gh run list --workflow=todo-today-harvest.yml`); cross-reference against your manual run above.
- **Independently sample the aggregators.** Don't trust the automation blindly: spot-open `todo.today/ubud/` (and, as they come online, Blissbase / Soulwise) and eyeball whether anything dead-centre our ICP was dropped by the category filter. If the filter is too tight/loose, tune `CATEGORY_MAP` / the keyword gates in the harvester.
- **Follow ≥1 sublink each run (the spider-web move) — MANUALLY.** Open one harvested event's detail page *in a real browser* (you, not the headless harvester — ToDo.Today detail pages sit behind a managed/Turnstile Cloudflare challenge that the stealth scraper can't pass, verified exhaustively 2026-06-03; the list API exposes no ticket URL either, so `external_ticket_url` stays null on todo-today events, which the playbook deems acceptable). Capture the ticket-direct URL (Momence/Megatix/Eventbrite — never the todo.today URL), backfill it, and **promote the first-party organiser domain into `discovered_pending`** (e.g. RISE → alchemyyogacenter.com). This is how the web grows: aggregator → event → its real source → a new tracked source. Automating it needs a paid CF-solving service — deferred.
- **Add ≥1 new source-of-sources or scraper per run when you can.** Propose a new aggregator/first-party site; when you build a new harvester script, register it (workflow + `event_sources` row, `is_enabled=false` if push-fed) and note it in `curator/sources.json`. Leave the web bigger than you found it.

**7. Cross-check the rest of the site.** Walk every public page (`/`, `/events`, `/guides`, `/experiences`, `/stories`, `/quiz`, `/membership`, `/about`, `/login`, `/partners`). For each, ask: does it work? Does it feel alive? Is the data fresh? Does the design carry the brand register? Where's the friction? Flag bugs, broken links, stale copy, design gaps. Mobile 390px especially — Bali users are mostly on phones.

**8. Surface 3-5 specific improvements.** Anything: a section that's underperforming, a page that needs new copy, a data signal we could use better, a feature that would make us more useful or more profitable (this needs to be a business eventually — membership, sponsorships, tour bookings, newsletter growth). Be opinionated. Lead with what you'd actually do, not options.

**9. Apply the low-risk fixes you proposed.** Small copy tweaks, broken-link fixes, obvious bugs — ship them. Anything that touches schema, payments, auth, or design system → propose only, wait for my nod.

**10. Commit + push.** Single commit or a small handful. Audit log should explain what changed and why. Push to main. Vercel auto-deploys.

**11. Append to `docs/daily-routine-log.md`.** One short entry, format below. Then propose any prompt update (see "Prompt evolution").

## Output format

Reply in this rough shape:

```
**Overnight summary.** (3-4 sentences.)

**Approver work I did.** (counts: approved N, archived off_topic M, archived dup K, repaired L, escalated E.)

**Feedback I actioned.** (counts: actioned A, dismissed D, reviewed R; one-line summary of the most useful report.)

**Live agenda.** (screenshot link + 1-2 sentences on what looks good / off.)

**Event spot-check.** (which N events I checked, what I found, what I fixed.)

**Discoveries.** (new venues / facilitators surfaced + any source proposals.)

**Site cross-check.** (page-by-page one-line read.)

**3-5 improvements I'd ship next.** (lead with the one you'd do first.)

**What I committed today.** (commit subjects + push status.)

**What needs your call.** (escalations.)

**Prompt-evolution proposal.** (if any — see below.)
```

## Don't

- Ask me to confirm SQL writes on the events table — that's the job.
- Create new pending-queue gates "for safety." If a row's borderline, escalate it explicitly in the report. Don't manufacture friction.
- Spend more than 60 minutes on the routine; if it's taking longer, surface the blocker.
- Generate planning documents or markdown summaries beyond the audit log. The conversation is the artefact.
- Patch the same bug class twice. After the second occurrence, fix the code, not the row.

## When you're truly unsure

If you can't tell whether something fits the brand or whether a change is safe, escalate it in the "What needs your call" section with a one-line option set. Don't freeze on a borderline; pick the more conservative path and flag it.

## Prompt evolution

This prompt is a living artefact. At the end of each run, ask yourself:

- **Did anything in this prompt slow me down or mislead me?** Vague instruction, missing context, redundant step, wrong tool suggested?
- **Did I solve a new class of problem the prompt didn't anticipate?** A check worth making standard, a category of bug worth naming, a quality bar worth codifying?
- **Did the brand register fail me somewhere?** Borderline-cases not yet listed; rules that contradicted each other?

If yes to any, **propose a concrete diff to `docs/daily-routine.md`** in the "Prompt-evolution proposal" section of your reply. Lead with the actual replacement text, not the description. Keep proposals tight — single sentence or short bullet, not paragraphs.

I'll either apply it myself in the next session, or push back if I disagree. Don't apply prompt edits autonomously — they shape every future run, so they deserve a moment of explicit ack.

Anti-patterns to avoid in proposals: adding length for length's sake; encoding day-of-week-of-week-specific instructions ("on Mondays, check X"); duplicating what's in the memory files. The prompt is a *frame*, not a script.

### Format for the daily log entry

Append to `docs/daily-routine-log.md`:

```
## YYYY-MM-DD (~Nmin)

- Overnight: <one line>
- Approver work: approved=A off_topic=O dup=K repaired=R escalated=E
- Feedback: actioned=A dismissed=D reviewed=R + one-line note on the most useful report
- Spot-check: <which events, what found>
- Site cross-check: <one line>
- Committed: <commit shas + subjects, one line each>
- Followups: <any escalations or "watch this next run">
- Prompt-evolution: <"none" or one-line description of proposal>
```

Keep it scan-able. Future-you will read this before starting tomorrow's run.

---

Be proactive. Be opinionated. This is your daily watch — make the site better than you found it.

Go.
