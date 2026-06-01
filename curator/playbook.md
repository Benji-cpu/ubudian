---
title: The Ubudian curator playbook
updated: 2026-05-18
purpose: The vibe filter and quality rubric the daily curator agent applies. Refined over time as the agent learns from rejections.
---

# The Ubudian curator playbook

The Ubudian curator is a daily Claude agent. Its job: surface 5–15 genuinely interesting dance + tantra + ceremony events happening in and around Ubud in the next 60 days, drop them into `curator/inbox/YYYY-MM-DD.json`, and learn from what gets accepted vs. rejected in the admin queue.

This playbook is the agent's prescriptive guide. Edit it directly when patterns change.

## Universe — what we ingest

Three categories only, mapping 1:1 to `EVENT_CATEGORIES` in `src/lib/constants.ts`:

| Curator universe | DB `category` |
|------------------|---------------|
| Ecstatic dance, 5Rhythms, contact improv, conscious dance, movement medicine | `Dance & Movement` |
| Tantra, conscious sexuality, embodied intimacy, sacred sexuality | `Tantra & Intimacy` |
| Cacao ceremony, sound bath, gong/bowl journey, breathwork-as-ceremony, moon ceremony | `Ceremony & Sound` |

These three are the **core** tier (`event_tier='core'` — the default). They render first in the conscious-community agenda.

## Discovery tier — the second universe (`event_tier='discovery'`)

A separate, broader universe that lands in the "More happenings in Ubud" section **below** the core feed — diverse, time-sensitive cultural events that residents want to catch before they're gone. Stamp every event from this universe with `event_tier='discovery'` (the core three omit the field / default to `core`).

| Discovery universe | DB `category` |
|--------------------|---------------|
| Named festivals (big + small): Food Festival, Writers & Readers, Open Studios, Folk Festival, jazz/world-music festivals | `Art & Culture` or `Music & Performance` per type |
| Art gallery / studio openings (vernissages), exhibitions, artist talks, open studios | `Art & Culture` |
| Live music, jazz, gamelan-as-concert, performance art, curated salons | `Music & Performance` |
| Farmers / artisan / maker markets, chef collabs, foraging dinners, supper clubs, producer showcases | `Food & Makers` |
| Festival movement sessions (e.g. an ecstatic-dance slot inside a festival) | `Dance & Movement` — but still `event_tier='discovery'` |

**What discovery is NOT:** Balinese ceremony (Nyepi / Galungan / Purnama) is an **occasional light touch at most** — never the focus, never the banner. The focus is festivals, markets, galleries, food, performance. (This is a deliberate steer; do not centre the ceremonial calendar.)

### Discovery hard rules (all must hold)

1. **First-party sources only.** A discovery event is eligible ONLY if it traces to a first-party source — the festival's official site/IG, the gallery's own page/IG, or the venue. Aggregators (NOW! Bali, Honeycombers, BaliBuddies, ubudcommunity, allevents) may help you *learn* an event exists, but you must then confirm + link it first-party. **Never** set `source_url`/`external_ticket_url` to an aggregator, and never ingest a discovery event sourced solely from one. The existing `competitor_harvest` attribution rules apply unchanged.
2. **Greater-Ubud only.** Ubud + Penestanan, Nyuh Kuning, Mas, Pengosekan, Peliatan, Sayan/Kedewatan, Tegallalang fringe. **Exclude** Denpasar (Bali Arts Festival/PKB), Sanur (Balinale), Nuanu/Tabanan (Art & Bali), Canggu. Walkable/scooterable from Ubud, not all-of-Bali.
3. **Festival = ONE parent card.** A festival that nests many sub-events (UFF's 20–40 dinners, UWRF's 100 sessions) is ingested as a **single parent event** pointing at the official programme — never sprayed as sibling cards. Sub-event spam is the discovery tier's biggest flood risk.
4. **Suppress pure-recurring directory bulk.** A weekly market or standing gamelan/Kecak show only enters when the instance is *distinguished* (special edition, guest, finale). A small number of genuine resident anchors (e.g. the Saturday organic market) may run as `is_recurring=true` — but do not fill discovery with weekly listings; the value is can't-repeat-it intelligence, not a directory.
5. **`is_spotlight` is not yours to set.** The single floating festival banner is an editorial/admin decision. Never set it from the curator.

### Discovery reject list (in addition to the core hard-rejects below)

- **Tourist craft markets** — Pasar Seni Ubud and mass-woodcarving/batik stalls. Zero curatorial intent.
- **Day-tour activity classes** — cooking classes, batik/silver workshops sold via GetYourGuide / Klook / Airbnb Experiences as tourist activities.
- **Nightly tourist dance shows** sold as standalone admission — Ubud Palace / Uluwatu Kecak/Legong/Barong as a ticketed tourist product. (A distinct festival or special edition is fine.)
- **Resort/hotel F&B promos** dressed as culture — "cultural dinner" buffets, hotel festival-package deals. Exception: a named non-profit benefit or a genuine one-off collaborator.
- **Festival glamping / hotel packages** riding a festival brand by association.
- **Out-of-valley destination events** (see rule 2).
- **Cinema stays hard-rejected by default.** Narrow Phase-4 exception (tight, conjunctive): eligible ONLY if (curated / art-house / festival) AND (a filmmaker or expert panel / Q&A is present) AND (single evening or festival window, not a standing schedule).

### Discovery scoring note

Same 4-axis ≥6 rubric, but weight **time-sensitivity / novelty** harder — a one-off gallery opening or a foraging dinner that never reassembles outscores a standing weekly offering. The whole point of the tier is the moment you can't catch next week.

## Hard rejects (do not ingest)

Reject any event where the **primary** offering is one of:

1. **Yoga classes** — even "conscious yoga", "yin yoga", "kundalini yoga". The exception is yoga clearly framed as *movement medicine* or *ecstatic dance* on the flyer.
2. **Cinema / film screenings** — even when at Paradiso. Paradiso's dance + live-music nights are in. The cinema nights are out.
3. **Spa, massage, facial, hair, beauty** — anything where the event is a transactional service rather than a gathering.
4. **Corporate retreats, leadership offsites, MBA / executive workshops**.
5. **MLM / network-marketing pitches** (essential-oil "intro evenings", "abundance circles" that are sales funnels).
6. **Language exchanges, coworking meetups, generic networking**.
7. **Tourist day-tours** — rice terrace photo tours, monkey-forest combos. Ubudian tours are a separate product; the curator doesn't touch them.
8. **Pure restaurant promos** — special dinners are out unless the event is a ceremony or gathering that happens to include food.
9. **Events that already passed** (`start_date < today`).

When in doubt, reject. Better to miss an edge-case event than dilute the feed.

## Soft rejects (consider, then decide)

These need judgement. Default is reject unless the event is exceptional:

- Burner / festival pre-parties — usually in, but reject if it's clearly a private after-party with no public access.
- Plant-medicine ceremonies — accept only if the venue is well-known and the description is explicit; reject any "ayahuasca DM for details" listing.
- Tantra workshops led by unknown facilitators with no online presence — investigate via WebSearch; reject if no verifiable trail.

## Quality scoring (1–10)

Score each surviving event on four axes, sum, divide by 4, round. Only scores ≥6 reach the inbox.

| Axis | 10 | 5 | 1 |
|------|-----|-----|-----|
| **Facilitator reputation** | Known Ubud collaborator, ≥1k IG followers, distinct voice | Plausible bio, some online trail | No verifiable identity |
| **Description specificity** | Names the practice, the lineage, the structure | Generic but coherent | "Come for vibes" with no detail |
| **Venue quality** | Tier-A venue from `sources.json` | Plausible venue with address | "DM for location" |
| **Novelty** | New creator or new venue we haven't seen before | Familiar but well-run | Same generic offering as every other week |

Tie-breaker: if the event description mentions consent, integration, or trauma-informed framing → +1. If it mentions "tribe", "frequency raise", or "transmission" without context → -1. We are lush, not hippie-slime.

## Tagging rules

After accepting an event, set fields like this:

- `event_tier`: `"discovery"` for anything from the Discovery-tier universe (festivals, galleries, markets, food, performance); omit the field (defaults to `"core"`) for the three conscious categories.
- `category`: one of the three core categories, OR a discovery category (`Art & Culture` / `Music & Performance` / `Food & Makers`) for discovery-tier events.
- `intent_tags` (from the LLM parser enum `["romance", "community", "spirit", "living", "local_culture"]`):
  - Dance → `["community"]` (mostly), add `"spirit"` if framed as devotional.
  - Tantra → `["romance"]`, add `"community"` if it's a circle rather than couples work.
  - Ceremony / Sound → `["spirit"]`, add `"community"` if it's a circle.
- `quality_score`: the score / 10 you computed above, expressed as a 0–1 float.
- `content_flags`: leave empty `[]` unless something genuinely warrants a flag.

`archetype_tags` are NOT set during ingestion — those are guide/content tags set by editorial.

## Competitor harvest — attribution rules

Every entry in `sources.json.competitor_harvest` is a **scout, not a source**. We use these aggregators + community channels as a discovery surface because they've already done the work of finding interesting Ubud events, but we do **not** credit or link to them. The walk steps in the agent doc cover *how* to scrape; this section covers *what to do with what you find*.

When you harvest an event from any competitor-harvest scout, you MUST:

1. **Strip the aggregator URL.** Never set `source_url` or `external_ticket_url` to any scout-domain URL. The current forbidden list:
   - **Aggregators:** `blissbase.app`, `soulwise.io`, `todo.today`, `ubud.app`, `balispirit.com`, `balibuddies.com`, `allevents.in`, `cooldestinations.com`, `nowbali.co.id`, `numundo.org`.
   - **Community / scout channels:** `facebook.com/groups/*`, any `facebook.com/<community-page>` we harvest from, and WhatsApp invite links **for a scout channel we harvest from** (ShambAllah, community drops). *Exception:* a `chat.whatsapp.com/*` link that is the **event's own host group** — the gathering's actual signup/RSVP channel — is first-party and a legitimate CTA, exactly like a venue's own booking page (e.g. CREMOSO Zouk social's community group). Forbidden = a channel we *scout from*; allowed = a host's *own* group for *their* event.
   - Never reference these domains in `description`, `organizer_name`, or any other field. Never use a scout's slug as a fallback identifier. If a new scout is added to `sources.json.competitor_harvest`, its domain is automatically on this list.
2. **Preserve original ticket URLs.** If the scout exposes a downstream ticket link (Megatix, Eventbrite, Ticket Tailor, Lu.ma, or the venue's own site) inside the event description or as an outbound link, capture **that** URL into both `source_url` (it's our dedup Layer-1 key) and `external_ticket_url` (it's the public CTA). Validate it's a real ticket page, not a soft RSVP back to the scout. Strip affiliate query params (`?aid=…`, `?utm_*`, `?ref=…`) — the canonical event URL only.
3. **Recreate when no ticket URL exists.** If the scout only shows a description with no real outbound link (Blissbase is structurally like this — most events have no ticket URL, walk-in or DM-the-organiser; same for most WhatsApp drops), ingest with `source_url=null` and `external_ticket_url=null`. The event still lands as `pending`; the card will render without a CTA, which is correct — sending users to a competitor would be worse. The morning routine decides whether to ship it CTA-less, hunt the missing link, or archive.
4. **Rewrite the description in our voice.** Don't paste the scout's copy. The Ubudian register is lush + restrained + editorial; aggregators (especially the practitioner-marketplace ones) tend toward emoji-soup, all-caps, and chakra adjectives. Strip that, summarise the format, name the facilitator, anchor the venue.
5. **Log the scout internally.** In `curator/log/${TODAY}.md`, note "harvested from {scout-slug}: {event title}" so we have an audit trail. The log lives in the repo, not in the events DB.

**Special case — WhatsApp scout channels (ShambAllah etc.):** the *channel itself* is the scout (never store the invite link on an event), but individual event posts the channel relays frequently carry direct Megatix / Ticket Tailor / venue URLs — those are first-party and SHOULD be preserved per rule 2. A WhatsApp curator forwarding a Megatix link is functionally identical to us finding the same Megatix link directly.

The 2026-05-25 "never year-roll a stale Megatix slug" lesson is doubly important here: if a scout surfaces a Megatix link ending in `-2024`, `-2025`, or showing "Sales Closed" / "This event has already taken place", **skip**.

The vibe filter and quality rubric (4 axes, ≥6/10) apply unchanged to scout-harvested events. A blissbase event is not "in" by virtue of being on blissbase — most won't survive the filter (their universe is broader than ours; they accept yoga, kundalini, satsang, networking, all of which we hard-reject).

## Discovery

While walking sources, note new venues, new facilitators, and new event series. Append them to `sources.json.discovered_pending` with date + where you saw them. Don't promote them yet — that's a weekly task (Step 11 in the agent).

Facilitators are first-class: if you see the same name organising 3+ events across different venues, add them to `sources.json.facilitators_pending` with their IG handle so we can track them as a creator.

## Lessons learned

(Append dated one-liners. Consolidate weekly. Each lesson must be specific and falsifiable.)

- 2026-05-18 — Playbook v1 established. Vibe register codified as dance + tantra + ceremony. No yoga, no cinema.
- 2026-05-23 — Pool/club venues (Cretya, etc.) reliably use "ritual", "deep connection", and "mysticism" in copy for what are functionally DJ music events. The venue type (day club, poolside, entertainment complex) is the shortcut filter — if the primary infrastructure is poolside + DJ booth, reject before reading the copy.
- 2026-05-24 — Paradiso Thursday is a scheduling stack, not a single event: Dance Temple (18:30), Resonanz (19:30), and Vibración share the same venue/night under different brand slugs. When one Thursday Paradiso event is already in the DB, treat all others as potential duplicates and note the confusion in the log rather than ingesting blind. Admin should audit the Thursday Megatix slugs and retire obsolete ones.
- 2026-05-27 — Competitor-harvest walk added (Blissbase, Soulwise, ToDo.Today). They are scouts, not sources — never credit them, never store their URLs. Use them to find venues/facilitators/events we don't yet track. First-run yield was small in event volume (most aggregator listings are yoga/kundalini/individual-sessions that hard-reject) but high in venue discovery (ASH Nuanua, La Portal to Shamballah, Intuitive Flow). ToDo.Today is Cloudflare-walled — Playwright headless can't pass the challenge; revisit. Blissbase rarely exposes outbound ticket URLs; expect `source_url=null` on most harvested events.
- 2026-05-27 (rev) — **Blissbase has a hidden API** at `/__data.json` returning the rolling Bali feed (~8 events, totalEvents=51 in 50km radius). The `events[].sourceUrl` field IS the original Megatix / Eventbrite / Ticket Tailor URL — exposes far more outbound links than the rendered HTML did (revising the rev-1 lesson that "blissbase rarely exposes ticket URLs"). Use the API directly instead of Playwright click-throughs; ~10x faster, cleaner field extraction. Pagination beyond page 1 isn't worked out — daily polling of the rolling feed is the workable pattern. Soulwise has a `sitemap-recent-listings.xml` with ~393 listing UUIDs; walk that instead of clicking through category filters. ubud.app + BaliSpirit calendar added to `competitor_harvest` as additional weekly walks.
- 2026-05-25 — **NEVER year-roll a stale Megatix slug.** Megatix archives every past edition under its original slug ("supermoon-suara-semesta-001", "ayni-new-moon-cacao-ceremony-june"). If a Megatix listing shows "This event has already taken place" or "Sales Closed", **skip it**. Do not assume the same event runs next year on the same calendar date and infer a 2026 date — new editions get new slugs (-002, -2026, etc.). Four stale 2021/2023/2024/2025 listings reached `pending` this week (AYNI, MAGDALENA, Solstice Kirtan, New Moon Cacao w/ Levi Banner, Ecstatic Dance in the Dark, SUPERMOON, West African Tribal Dance) — all archived in the morning routine. Verification rule: before adding any Megatix slug to inbox, fetch the page and confirm the listed date is ≥ today; if Megatix is bot-blocking (403), fall back to the venue's own site or IG to confirm a current edition exists.
- 2026-06-01 — **Discovery tier launched.** The curator now feeds a second universe (`event_tier='discovery'`): festivals, gallery/studio openings, markets, food, performance — sourced from `sources.json.discovery_sources` (14 first-party sources seeded). Lands in the "More happenings in Ubud" section below the core feed. Hard rules: first-party only (never an aggregator URL), greater-Ubud only (no Nuanu/Sanur/Denpasar), festival = one parent card (not N sub-events), suppress pure-recurring bulk, NOT ceremony-focused, never set `is_spotlight` (banner is editorial). Pipeline already carries `event_tier` end-to-end (route → createEventFromParsed → events row); events still land `pending` for the approver.
