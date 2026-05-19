# Morning routine — daily log

Each morning Claude appends one entry per run. Newest at the bottom. Use this to spot patterns: same bug class recurring across days, drift in volume, recurring escalations.

Keep entries tight (~10 lines). When the file gets long, archive the oldest months into a yearly file (`morning-prompt-log-2026.md`).

---

## 2026-05-20 (~60min)

- Overnight: approver self-healed the BLOCKED stub from 2026-05-19; approved 5 / off_topic 1 / dup 0 / escalated 0. Curator surfaced 7 new events, 4 venues (Dragon Tea Temple, Azadi, Bara Studio, AYMC), 6 facilitators.
- Approver work: pending queue was empty — approver had drained it. My contribution: archived 191 stale `approved` events whose start_date had passed (oldest 2026-03-09), plus 3 dead-link 404s (megatix typo slugs + dead embodiedawakeningacademy URL).
- Spot-check: 8 events (Beauty Way, Full Moon Raio, Friday ED Yoga Barn, Vibración, Dragonfly, Entropic, Contact Dojo Jam, Solo Improv w/ Nastya). Card↔detail parity intact; Entropic shows 11am Wed contact-dance (worth a source check); Vibración price "IDR 90000" no commas. Friday ED megatix slug really is 404 (slug `friday-ecstatic-dance-25` rotates) — cleared the URL.
- Site cross-check: /events + / hero subtitles + CTAs were invisible (charcoal text on dark bg). Root cause: `--brand-cream` and `--brand-deep-green` invert in `.dark`, but those heroes lock their bg dark in both themes. Fixed both heroes with literal hex. /guides, /experiences, /membership healthy. /stories 404 is intentional (`stories_enabled=false`) but membership tier copy still promises "Humans of Ubud stories" — copy bug.
- Committed: migration `20260520070000_archive_stale_approved_events.sql`; `archivePastApprovedEvents()` wired into nightly maintenance; `checkExternalLinkHealth()` uses real browser UA + HEAD→GET fallback; hero text fixes on `events-hero.tsx` + `app/page.tsx`; copy "on right now" → "on the agenda right now".
- Followups: (1) Entropic 11am — sanity-check at source. (2) Membership copy promises stories while stories_enabled=false. (3) 359 usages of `text-brand-cream`/`text-brand-deep-green` — audit any other locked-dark section. (4) Yoga Barn Friday ED needs a per-week URL refresh strategy.
- Prompt-evolution: yes — add a brand-register note about `--brand-cream` inversion on locked-dark heroes (proposed in the wrap-up reply).
