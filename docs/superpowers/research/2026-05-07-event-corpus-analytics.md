# Event corpus analytics — Phase 0b brief

**Date:** 2026-05-07
**Source:** Production Supabase (`events`, `experiences`).
**Purpose:** Ground the experiences-as-trust-ladders plan in real corpus shape before building the rungs / practitioners / venues structure.

## Headline numbers

| Metric | Value |
|---|---|
| Total events | 434 |
| Approved | 243 |
| Archived | 141 |
| Rejected | 50 |
| Pending | 0 |
| `experiences` rows | 1 (single seed row) |

The "rename or restructure" question dissolves: there is effectively no `experiences` content live. Anything we do to the table is greenfield — no user-facing data has to migrate. Drop the rename anxiety.

## Status concentration

Approved events are 56% of the lifetime corpus; archived 33%; rejected 11%. The image-GC sweep shipped this morning (commit `c49b269`) targets the archived bucket — 141 rows is enough volume to validate the run is safe before we let it touch a wider net.

## Organizer distribution

187 approved events carry an organizer string; **86 distinct values** before dedup. Power-law head:

| Rank | Organizer | Events |
|---|---|---|
| 1 | Ubud Studio | 37 |
| 2 | Alifa | 13 |
| 3 | Kirana Nusantara | 8 |
| 3 | Alifa at Blossom Ubud | 8 |
| 5 | The Yoga Barn | 5 |
| 5 | Arkamara Dijiwa | 5 |

Top 5 = 71 events (38% of all organizer-tagged approved events). Top 25 cover ~117/187 (63%).

**Dedup signal in the head:**
- `Alifa` (13) + `Alifa at Blossom Ubud` (8) — same person, venue suffix appended on some entries. Backfill to one practitioner = 21 events.
- `TANTRA ESSENCE` / `Tantra Essence` and `Toltech` / `TOLTECH` — case-only dupes, ~3-4 collapsible pairs in the long tail.
- `Ubud Studio` (37) and `The Yoga Barn` (5) almost certainly resolve to **venues running in-house programming**, not practitioners — see venue/organizer overlap below.

After defensible dedup the practitioner backfill probably lands at **50–65 distinct rows**, not 86. That's a manageable hand-curate-with-LLM-assist pass for Phase 7.

## Venue distribution

| Rank | Venue | Events |
|---|---|---|
| 1 | Ubud Studio | 41 |
| 2 | Blossom Space Ubud | 20 |
| 3 | The Yoga Barn | 19 |
| 4 | Paradiso Ubud | 17 |
| 5 | Arkamara Dijiwa Ubud | 6 |

Long tail of normalisation noise: `Paradiso Ubud` (17) + `Paradiso` (6); `The Yoga Barn` (19) + `yogabarn` (3); `Blossom Space Ubud` (20) + `Blossom Ubud` (3); generic strings like `Ubud` (6), `Ubud, Bali` (5), `Ubud center` (4) — these will need manual review, the venue normaliser already handles the structured cases.

**The big finding:** **48/158 (30%) of approved events have `organizer_name` exactly equal to `venue_name`** (case-insensitive trimmed). Ubud Studio, Paradiso, Yoga Barn, Blossom — these are venues running programming, currently miscategorised as practitioners. The plan's separate `venues` table is validated: ≈10 venue entities will absorb ~30% of organizer rows that aren't actually people.

## Category distribution (approved events)

| Category | Events | Distinct organizers |
|---|---|---|
| Dance & Movement | 92 | 21 |
| Ceremony & Sound | 27 | 16 |
| Tantra & Intimacy | 26 | 15 |
| Retreat & Training | 20 | 9 |
| Circle & Community | 20 | 13 |
| Yoga & Meditation | 17 | 12 |
| Healing & Bodywork | 15 | 12 |
| Art & Culture | 11 | 8 |
| Other | 10 | 6 |
| Music & Performance | 5 | 4 |

**Dance & Movement** is the fattest category by 3.4×. It's also the most concentrated (60 events / 21 organizers — Ubud Studio dominates the head). This is the right category to pilot the rungs structure: rung-1 ecstatic-dance drop-in → rung-2 contact / 5Rhythms intensive → rung-3 facilitator training.

**Tantra & Intimacy** has the most fragmented head (15 organizers / 18 events with organizer-tagged) and ties for the second fragmented overall. Almost no repeat presenters — fits the small-circle / artisan archetype, and validates the ladder framing (one workshop → multi-day intensive → ongoing pod) over a flat directory.

## Field-coverage gaps for practitioner outreach (Phase 7)

Of 187 approved events with an organizer:

| Field | Populated | Coverage |
|---|---|---|
| `organizer_instagram` | 53 | 28% |
| `organizer_contact` | 66 | 35% |
| `external_ticket_url` | 141 | 75% |
| `price_info` | 170 | 91% |
| `archetype_tags` | 0 | 0% |

**Practitioner outreach (Phase 7) is currently blocked by the IG / contact gap.** Only 28% of organizers have an IG handle in the row; only 35% have any contact string at all. Before Phase 7 can run, we need either an IG-scrape pass against the source URLs or an LLM enrichment pass over `description` / `raw_text_snippet` to lift handles into structured fields.

**`archetype_tags` is empty across the corpus.** The plan assumed this column was reusable — it is not. Two options:

1. **Backfill via LLM** as part of Phase 1 (single batch pass over the 243 approved events, 5–10 tags from the existing taxonomy per event). Cheap, deterministic, ~$2–4 in Gemini cost.
2. **Drop the reuse assumption** and treat archetype_tags as a future feature applied at ingestion time only.

Recommend Option 1 — without tags the affinity / matching layer (Phase 4) and rung clustering (Phase 1) lose a key signal.

## Recurrence and core flag

- 59 recurring (24%), 184 one-off (76%) — most events are single-shots.
- 9 marked `is_core` — the existing curation / pinning machinery is barely used. Either the rungs structure subsumes `is_core` or `is_core` becomes the rung-0 / "always-on" lane within an experience.

## Monetisation surface

**75% of approved events route to external ticket URLs.** The current Ubudian is a signpost, not a transactor. This validates the affiliate / referral revenue line in the Phase 8 plan: every external click is already happening — wrapping the URL in a `/r/[token]` redirect captures attribution with no UX change for the visitor.

**91% have price_info populated** but the field is text (not cents). Pricing is currently visible to users but not queryable / not segmentable by tier. If we want "filter by price band" or "free events only" to work properly, the parser needs a numeric `price_min_cents` / `price_max_cents` extraction step. Defer to Phase 6 monetisation work.

## Implications for the experiences-trust-ladders plan

1. **Drop the `experiences` rename anxiety.** Only 1 row exists. Whatever we extend `experiences` into (rungs, practitioners, venues) is effectively new.
2. **Practitioner backfill = 50–65 rows after dedup**, not 86. Curate-by-hand with LLM assist is realistic for Phase 1.
3. **Stand up the `venues` table on day 1.** ≈30% of "organizer" rows are actually venues — without a venue concept, the practitioner backfill carries fake people.
4. **Run an LLM archetype-tagging pass in Phase 1.** The column is empty; downstream affinity / clustering needs it.
5. **Block Phase 7 (practitioner outreach) on a contact-enrichment sub-task.** 28% IG coverage / 35% contact coverage is too thin to draft outreach DMs against.
6. **Pilot the rungs structure in Dance & Movement.** Largest, most concentrated, has a clear 3-tier ladder shape (drop-in → intensive → training).
7. **Image GC on archived events is safe to enable.** 141 archived rows is a real but bounded blast radius for the first sweep.

## Queries used

```sql
-- Status counts
SELECT
  (SELECT COUNT(*) FROM experiences) AS experiences_count,
  (SELECT COUNT(*) FROM events WHERE status = 'approved') AS approved,
  ...

-- Organizer distribution
SELECT TRIM(organizer_name), COUNT(*) FROM events WHERE status = 'approved' AND ...

-- Venue distribution
SELECT TRIM(venue_name), COUNT(*) FROM events WHERE status = 'approved' AND ...

-- Field coverage
SELECT COUNT(*) FILTER (WHERE archetype_tags IS NOT NULL AND array_length(archetype_tags,1) > 0) ...

-- Organizer == venue overlap
SELECT COUNT(*) FILTER (WHERE LOWER(TRIM(organizer_name)) = LOWER(TRIM(venue_name))) ...
```

Re-run any of these via `mcp__supabase__execute_sql` to refresh as the corpus grows.
