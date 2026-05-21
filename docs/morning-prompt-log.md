# Morning routine — daily log

Each morning Claude appends one entry per run. Newest at the bottom. Use this to spot patterns: same bug class recurring across days, drift in volume, recurring escalations.

Keep entries tight (~10 lines). When the file gets long, archive the oldest months into a yearly file (`morning-prompt-log-2026.md`).

---

## 2026-05-21 (~60min)

- Overnight: curator surfaced 7 events for 2026-05-21 (SUPERMOON 9th anniv, 2× Kintsugi @ Dragon Tea Temple, Full/New Moon kirtans, Master Lover couples retreat, Heart Space Bali cacao). Maintenance digest flagged 9 missing-`start_time` events + 2 broken links. Approver disabled, queue was sitting unprocessed in `curator/inbox/`.
- Approver work: approved=13, off_topic=10, dup=2, repaired=2, escalated=0. **Root cause for the empty pending queue: GH workflow `curator-ingest.yml` used `ls -t` on a fresh checkout — equal mtimes → unstable sort → it kept POSTing 2026-05-19.json (the oldest file) for three days. Fixed (use `sort | tail -1`) and manually `curl`-POSTed the 2026-05-20 + 2026-05-21 inboxes; both reported 7/7/0/0 ingested.** Digest cleanups: 7× training-not-gathering (Inner Temple ×3, Momentum Contact Facilitator Training ×3, Anandasarita Inner Mastery), 1× dead-link (Divine Darkness "Sunday Worship"), 1× not-specific (Regular Circling), 1× off-brand commercial (Heart Space Bali — confirmed via web fetch, this is destination-wellness tourist-coded, not local ceremony). Dedup: Songs of the Dragonfly ingested twice w/ same Megatix URL (kept long-titled variant), Cremoso Night zouk has Mon+Tue duplicates from conflicting day_of_week parses (kept the one with the WhatsApp join link).
- Spot-check: Card↔detail parity OK on SUPERMOON + Kintsugi Jun 26 (post-rename). No past-date leakage. Title bug surfaced: `/experiences` rendered "Ubud Retreats | The Ubudian | The Ubudian" — root layout uses template `%s | The Ubudian` but ~30 page metadata files redundantly included the suffix. Stripped via sed across `src/app/**/page.tsx`.
- Site cross-check: all 10 main routes 200. `/membership` had no metadata of its own (rendered tab title "The Ubudian"); added one. Yesterday's followup remains: membership tier copy still promises "Humans of Ubud stories" while `stories_enabled=false`.
- Committed: migration `20260521082535_morning_triage_2026_05_21.sql` (14 triage rows + 2 dedup rows); workflow fix in `curator-ingest.yml`; sed pass stripping ` | The Ubudian` from 30+ page metadata files; `/membership` metadata.
- Followups: (1) Promote Dragon Tea Temple to `priority_b` in `curator/sources.json` — 3 of today's approvals came from there; the curator's Sunday Step-11 promotion logic should already catch it but worth a manual nudge. Heart Space Bali should be moved to `rejected_permanent` so it stops re-surfacing. (2) Several long-running approved events have no cover image (Songs of Dragonfly, Solo Improv w/ Nastya, Authentic Relating Games, Thai Massage Jam) — cards fall back to gradient placeholders. (3) Newsletter signup not surfaced on `/events` where intent is highest. (4) The `ls -t` class of bug could exist in the approver-fetch + approver-apply workflows too — audit when they're next active.
- Prompt-evolution: proposed an edit to step 1 of the prompt — see wrap-up.

## 2026-05-20 (~60min)

- Overnight: approver self-healed the BLOCKED stub from 2026-05-19; approved 5 / off_topic 1 / dup 0 / escalated 0. Curator surfaced 7 new events, 4 venues (Dragon Tea Temple, Azadi, Bara Studio, AYMC), 6 facilitators.
- Approver work: pending queue was empty — approver had drained it. My contribution: archived 191 stale `approved` events whose start_date had passed (oldest 2026-03-09), plus 3 dead-link 404s (megatix typo slugs + dead embodiedawakeningacademy URL).
- Spot-check: 8 events (Beauty Way, Full Moon Raio, Friday ED Yoga Barn, Vibración, Dragonfly, Entropic, Contact Dojo Jam, Solo Improv w/ Nastya). Card↔detail parity intact; Entropic shows 11am Wed contact-dance (worth a source check); Vibración price "IDR 90000" no commas. Friday ED megatix slug really is 404 (slug `friday-ecstatic-dance-25` rotates) — cleared the URL.
- Site cross-check: /events + / hero subtitles + CTAs were invisible (charcoal text on dark bg). Root cause: `--brand-cream` and `--brand-deep-green` invert in `.dark`, but those heroes lock their bg dark in both themes. Fixed both heroes with literal hex. /guides, /experiences, /membership healthy. /stories 404 is intentional (`stories_enabled=false`) but membership tier copy still promises "Humans of Ubud stories" — copy bug.
- Committed: migration `20260520070000_archive_stale_approved_events.sql`; `archivePastApprovedEvents()` wired into nightly maintenance; `checkExternalLinkHealth()` uses real browser UA + HEAD→GET fallback; hero text fixes on `events-hero.tsx` + `app/page.tsx`; copy "on right now" → "on the agenda right now".
- Followups: (1) Entropic 11am — sanity-check at source. (2) Membership copy promises stories while stories_enabled=false. (3) 359 usages of `text-brand-cream`/`text-brand-deep-green` — audit any other locked-dark section. (4) Yoga Barn Friday ED needs a per-week URL refresh strategy.
- Prompt-evolution: yes — add a brand-register note about `--brand-cream` inversion on locked-dark heroes (proposed in the wrap-up reply).
