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

- `category`: one of the three from the Universe table.
- `intent_tags` (from the LLM parser enum `["romance", "community", "spirit", "living", "local_culture"]`):
  - Dance → `["community"]` (mostly), add `"spirit"` if framed as devotional.
  - Tantra → `["romance"]`, add `"community"` if it's a circle rather than couples work.
  - Ceremony / Sound → `["spirit"]`, add `"community"` if it's a circle.
- `quality_score`: the score / 10 you computed above, expressed as a 0–1 float.
- `content_flags`: leave empty `[]` unless something genuinely warrants a flag.

`archetype_tags` are NOT set during ingestion — those are guide/content tags set by editorial.

## Discovery

While walking sources, note new venues, new facilitators, and new event series. Append them to `sources.json.discovered_pending` with date + where you saw them. Don't promote them yet — that's a weekly task (Step 11 in the agent).

Facilitators are first-class: if you see the same name organising 3+ events across different venues, add them to `sources.json.facilitators_pending` with their IG handle so we can track them as a creator.

## Lessons learned

(Append dated one-liners. Consolidate weekly. Each lesson must be specific and falsifiable.)

- 2026-05-18 — Playbook v1 established. Vibe register codified as dance + tantra + ceremony. No yoga, no cinema.
- 2026-05-23 — Pool/club venues (Cretya, etc.) reliably use "ritual", "deep connection", and "mysticism" in copy for what are functionally DJ music events. The venue type (day club, poolside, entertainment complex) is the shortcut filter — if the primary infrastructure is poolside + DJ booth, reject before reading the copy.
