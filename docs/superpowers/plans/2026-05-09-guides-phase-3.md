# Guides Section — Phase 3 Plan

## Context

Phase 2 shipped 10 guides with rich cross-linking infrastructure. Two structural gaps remain:

1. **Three shortcode kinds resolve to nothing.** `{{practitioner:slug}}`, `{{place:slug}}`, and `{{partner:slug}}` fall back to styled inline text because the resolvers in `src/lib/guides/resolvers.ts` only handle event / story / retreat. Guides currently *can't* link to the humans, places, and venues they implicitly reference.
2. **No public surface for the entities themselves.** `practitioners` (4 seeded) and `partners` (0 rows, schema only) tables exist with admin CRUD at `/admin/practitioners` and `/admin/partners`, but neither has a public route. Editors can author profiles; readers can't see them. The `places` table doesn't exist at all.

This is the missing layer of the platform — the people, venues, and partners who carry the guide content into reality. Without them, guides reference a world the site can't link to. Adding them turns every shortcode in every guide into a navigable graph, and turns the existing journey-atom system (which already references practitioners and partners) into a fully connected experience.

Phase 3 builds:
- A new `places` table.
- Public detail and listing pages for **practitioners**, **places**, and **partners**.
- The three missing shortcode resolvers (so guides immediately link to live cards).
- Reverse cross-linking — `MentionedInGuides` rendered on each new detail page.
- A modest seed set (~6–10 entities) with brand-locked imagery.
- Quiz integration — practitioners surface as a fifth recommendation type alongside events/tours/stories/guides.

Saved-entity bookmarking, map views, and reviews are explicitly deferred to a later phase. The cross-link reverse-direction is what unlocks the most value here, not user-personalisation features.

---

## Scope

### A. Schema

1. **New `places` table.** Modelled on `practitioners` (lightweight, profile-shaped, not commercial like `partners`).

   ```sql
   create table places (
     id uuid primary key default gen_random_uuid(),
     slug text unique not null,
     name text not null,
     kind text not null check (kind in (
       'temple','venue','cafe','restaurant','studio','spa','retreat_centre',
       'natural','market','other'
     )),
     description text,
     short_description text,
     photo_urls text[] not null default '{}',
     hero_image_url text,
     address text,
     neighbourhood text,
     latitude numeric,
     longitude numeric,
     google_maps_url text,
     website_url text,
     instagram_handle text,
     opening_hours text,
     price_range text,                              -- '$' to '$$$$' free-text
     theme_tags text[] not null default '{}',
     archetype_tags text[] not null default '{}',
     intent_tags text[] not null default '{}',
     is_published boolean not null default false,
     sort_order int not null default 0,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   );

   create index places_kind_idx on places(kind);
   create index places_published_idx on places(is_published);
   create index places_theme_tags_gin on places using gin (theme_tags);
   create index places_archetype_tags_gin on places using gin (archetype_tags);
   create index places_intent_tags_gin on places using gin (intent_tags);

   alter table places enable row level security;
   create policy "places_public_read" on places for select using (is_published = true);
   create policy "places_admin_all" on places for all using (is_admin()) with check (is_admin());
   ```

2. **Enrich `practitioners` and `partners`** with the same taxonomy already used by guides and (now) events:
   - `archetype_tags text[] not null default '{}'`
   - `intent_tags text[] not null default '{}'`
   - GIN indexes on each
   - Conservative backfill from existing fields (e.g. practitioner.modalities → archetype/intent), leaving genuinely ambiguous rows empty.

3. **Add `hero_image_url` and `short_description`** to both `practitioners` and `partners` for richer detail-page rendering. Backfill `hero_image_url` from `practitioners.photo_url` where present.

### B. Shortcode resolvers

Add three resolvers to `src/lib/guides/resolvers.ts` mirroring the existing event/story/retreat shape:

```ts
async function resolvePractitioner(slug: string): Promise<ResolvedEntity | null> { … }
async function resolvePlace(slug: string): Promise<ResolvedEntity | null> { … }
async function resolvePartner(slug: string): Promise<ResolvedEntity | null> { … }
```

Each queries the relevant table by slug, filtering by `is_published`/`is_active`, and returns title + subtitle + href + image. Unresolved rows continue to fall back to styled inline text. Wire them all into `defaultGuideResolvers`.

The instant payoff: every existing `{{practitioner:…}}` shortcode in the seeded guides becomes a live, linked card without re-saving the guide.

### C. Public surface

Three parallel route groups. Each follows the same pattern; the structural lift happens once.

**Practitioners** (`/practitioners`, `/practitioners/[slug]`):
- Listing: cards in a 3-up grid, filterable by modality (chip rail) and intent.
- Detail: portrait hero (3:4) on a card, name + base location + modalities, long-form bio (markdown), contact CTAs (WhatsApp, Instagram, email), `MentionedInGuides`, related practitioners (same modality), upcoming events at their venue if any (via `event.venue_name` text-match or, more cleanly, a future `event.practitioner_id` FK — out of scope for now).

**Places** (`/places`, `/places/[slug]`):
- Listing: cards in a 3-up grid, filterable by kind (temple / cafe / studio / …) and intent.
- Detail: hero photo, neighbourhood + kind + price range, description, opening hours, address with "Open in maps" link, `MentionedInGuides`, related places (same neighbourhood or kind).

**Partners** (`/partners`, `/partners/[slug]`):
- Listing: cards in a 2-up grid (denser, more commercial-looking), filterable by kind.
- Detail: hero photo, brief description, **internal landing** with prominent external CTA (the affiliate link). Click-tracking via `next/link` `onClick` writing to a `partner_clicks` table — defer to a future phase if it adds friction; v1 just renders the link with `rel="sponsored noopener"`.
- A discreet "Sponsored partner of The Ubudian" footer line. No other monetisation chrome.

All three use the same editorial-luxury card and detail register established by guides. No reviews, no ratings, no inline comments.

### D. Cross-linking

`MentionedInGuides` (already shared) rendered at the bottom of each new detail page. The `guide_entity_references` join table is already populated — once the resolvers are wired, the existing 5 phase-1+phase-2 references for practitioners/places/partners light up automatically. Today there are zero references in those rows; adding seed content + matching guide bodies (Phase 3 task F) will fix that.

### E. Quiz integration

Add `getPractitionersForArchetype` to `src/lib/quiz-helpers.ts` mirroring the existing `getStoriesForArchetype` shape. Practitioners with explicit `archetype_tags` (Tier 1) match first; modalities → archetype affinity (Tier 2) backfills.

`/quiz/results/[archetype]` adds a "Practitioners for The X" section between Stories and Tours. 3 cards. Same affordance as the existing recommendation rails.

Places and partners are intentionally **not** quiz-recommended in v1 — they're ambient context, not personalised picks. If editorial demand emerges, easy to add later.

### F. Content & imagery

The minimum to make the surface feel populated:

- **3 new places** (so listing has something) — Pura Saraswati (temple), Yellow Flower (cafe/community), Paradiso (studio).
- **2 new partners** — one villa partner (e.g. "Villa Ametis"), one bodywork studio. Real partnerships ideally; placeholder copy if not yet locked.
- **2 hero images per practitioner** for the 4 existing rows that don't have proper editorial photos (current `photo_url` is a small avatar — not detail-page-grade). Maintain the brand-locked Stability AI prompt style.
- **1 hero per new place** + **1 hero per new partner**.

Total imagery: 8 × hero + 4 × cards ≈ 12 generations. Mirror the existing `scripts/generate-phase2-guide-images.ts` pattern with a new script `scripts/generate-phase3-atom-images.ts`.

After authoring, **edit two of the existing guides** to use the new shortcodes (e.g. `meeting-your-spiritual-teacher` body now mentions specific practitioners by name — replace those with `{{practitioner:made-nawa-pranic-healing}}` etc.). The body-edit triggers `sync_guide_references` and the cross-link surface populates immediately.

### G. Nav

- **Top-level nav**: add nothing. The audience reaches these pages via the Guides links and the journey atoms — top-level real estate is precious, and three sub-sections would crowd it.
- **Footer + about page**: add quiet links to `/practitioners` and `/places`. `/partners` stays out of public navigation (commercially-tinged, indexed only for SEO).
- **Sitemap**: all three listings + all published slugs. Mirror the guides addition in Phase 2.

---

## File-Level Plan

**New migrations:**
- `supabase/migrations/20260509110000_create_places.sql`
- `supabase/migrations/20260509110100_practitioners_partners_taxonomy.sql` — adds archetype_tags, intent_tags, hero_image_url, short_description; conservative backfill
- `supabase/migrations/20260509110200_seed_places_partners.sql` — 3 places + 2 partners (idempotent UPSERTs by slug)

**New source files:**
- `src/lib/places/types.ts` — `Place`, `PlaceKind`, registry
- `src/lib/places/queries.ts` — getPublishedPlaces, getPlaceBySlug
- `src/components/admin/place-form.tsx` — Zod + RHF mirroring `practitioner-form.tsx`
- `src/app/admin/places/{page,new,[id]/edit}.tsx` — admin CRUD
- `src/app/practitioners/{page,[slug]/page}.tsx` — public listing + detail
- `src/app/places/{page,[slug]/page}.tsx` — same
- `src/app/partners/{page,[slug]/page}.tsx` — same
- `src/components/practitioners/practitioner-card.tsx` + `practitioner-detail.tsx`
- `src/components/places/place-card.tsx` + `place-detail.tsx`
- `src/components/partners/partner-card.tsx` + `partner-detail.tsx`
- `src/app/{practitioners,places,partners}/[slug]/opengraph-image.tsx` — per-entity OG, mirroring `src/app/guides/[slug]/opengraph-image.tsx`
- `scripts/generate-phase3-atom-images.ts` — Stability AI batch
- `src/lib/quiz-helpers.ts` — extend with `getPractitionersForArchetype`
- Tests: `src/lib/__tests__/quiz-helpers.test.ts` extension; `src/lib/__tests__/places/queries.test.ts`

**Modified files:**
- `src/lib/guides/resolvers.ts` — add practitioner/place/partner resolvers
- `src/lib/feedback/capture-feedback-context.ts` — `/practitioners/:slug`, `/places/:slug`, `/partners/:slug` route patterns
- `src/app/sitemap.ts` — add the three listings (priority 0.7) and dynamic detail pages (priority 0.6)
- `src/types/index.ts` — `Place`, augmentations to `Practitioner` and `Partner`
- `src/lib/constants.ts` — `ADMIN_GROUPED_ROUTES` already groups `/admin/practitioners` and `/admin/partners` under `/admin/tours`; add `/admin/places` to the same group
- `src/components/layout/footer.tsx` — quiet "Practitioners" and "Places" links
- `src/app/quiz/results/[archetype]/page.tsx` — render practitioners section
- Two existing guide bodies in production — edit via /admin/guides to swap free-text mentions for shortcodes (no code change; content edit only)

**Reused patterns:**
- `MentionedInGuides` (`src/components/cross-links/mentioned-in-guides.tsx`) — works as-is once resolvers wire up
- Stability AI generation pattern (`scripts/generate-phase2-guide-images.ts`)
- The journey-atom rendering in `src/components/journeys/` already references practitioners/partners — minor refactor opportunity to make atoms link to the new public pages instead of free-text

---

## Out of Scope (explicit)

- **Saved practitioners / places / partners.** People bookmark guides because guides are reading; practitioners and places are looked up, not collected. Add later if usage signals demand it.
- **Map view.** A pin-clustered map of all places would be lovely. It's also a non-trivial component (Mapbox or MapLibre, performance, mobile). Defer.
- **Reviews and ratings.** Out of scope philosophically — the editorial register doesn't survive a 4-star averaging system.
- **`partner_clicks` analytics table.** Useful for partner-attribution conversations but not required for v1.
- **`event.practitioner_id` FK** on events to enable "upcoming events with this practitioner" on the practitioner page. Currently best done via venue text-match or organiser_name. Defer; the join is fragile until practitioner profiles are mature.
- **Members-only practitioner intros.** Same paywall question that's been deferred from guides Phase 1.
- **Translations / localisation.**

---

## Risks & Mitigations

- **Tonal collision with the editorial register.** Partners is the obvious risk — affiliate links and commission rates can quickly turn the section into a directory. Mitigation: render the partner card identically to the place card; rely on a single `Sponsored partner` line at the bottom of the detail page rather than a "BUY NOW" pattern. Affiliate URLs as `rel="sponsored noopener"`. No badges, no callouts, no "limited offer" copy — ever.
- **The practitioner page becomes a vanity profile.** A practitioner detail page that''s mostly contact info reads as a thin LinkedIn. Mitigation: every practitioner detail page must have a real bio (target ≥150 words). Empty/short bios fall back to a "Profile coming soon" pattern that still resolves the shortcode but renders flatter. Editor's job to write real bios for the 4 seeded rows before launch.
- **The cross-link surface goes silent if guides don't reference these entities.** All the resolver/cross-link infra is moot without shortcodes in guide bodies. Mitigation: Phase 3''s task F includes editing two existing guides to add real practitioner shortcodes — this is a content task, not a code task, but it''s required for the feature to feel alive.
- **Places kind enum has too many values.** The 10-value enum risks editor decision-paralysis. Mitigation: lead with 4 obvious ones (temple, cafe, studio, retreat_centre); the others exist for completeness but no one has to use them.
- **Slug collisions across kinds.** Slugs are scoped per-table — no cross-table uniqueness — but the resolver layer keys by `kind:slug` so this can''t produce ambiguity. No mitigation needed; flagging only because it might surprise an editor.

---

## Verification

End-to-end checks before declaring done:

1. **Migrations applied** via Supabase MCP — `places` table, `practitioners` and `partners` augmentations, seed migration. Verify with `mcp__supabase__execute_sql` that:
   - 3 places, 2 partners present
   - All 4 practitioners now have non-null `hero_image_url` and `short_description`
   - GIN indexes on `places.theme_tags`, `places.intent_tags`, etc. exist
2. **Tests pass** — `npm test` clean. New: places query tests, practitioner archetype-match tests, resolver tests for the three new kinds.
3. **Lint** — `npm run lint` clean.
4. **Resolver smoke** — visit a guide whose body now contains a `{{practitioner:made-nawa-pranic-healing}}` shortcode; confirm the inline link resolves to a live `/practitioners/made-nawa-pranic-healing` URL with the correct name.
5. **Cross-link smoke** — visit `/practitioners/made-nawa-pranic-healing`; "Mentioned in [guide]" card appears at the bottom listing the guide(s) referencing them.
6. **Public listings** — `/practitioners` shows 4 cards filterable by modality; `/places` shows 3 cards filterable by kind; `/partners` shows 2 cards filterable by kind. No empty-state copy hits unexpectedly.
7. **Detail pages** — all three render with hero image, contact rails (where present), bio/description prose, and `MentionedInGuides` footer.
8. **Quiz** — `/quiz/results/seeker` shows "Practitioners for The Seeker" with at least one practitioner card.
9. **Sitemap** — `theubudian.life/sitemap.xml` includes `/practitioners`, `/places`, `/partners`, and all published slugs.
10. **Visual pass via Playwright MCP** at desktop (1440) + mobile (390): the three listings, one detail page from each, and the quiz results.
11. **Production smoke** — post-push, browse the new sections.

---

## Suggested Execution Order (chunks)

Each chunk = one or more commits. Designed depth-first so the user can ship Chunk 5 and stop if scope tightens.

1. **Schema + types** — places migration, practitioners/partners taxonomy migration, types updated. No UI yet.
2. **Resolvers + cross-links light up** — add the three resolvers, write tests, verify guide shortcodes resolve. Smallest unit with the highest leverage. Could ship alone and the section feels different immediately.
3. **Admin places** — `/admin/places` CRUD mirroring practitioners admin. Editors can author the 3 places.
4. **Public detail pages** — `/practitioners/[slug]`, `/places/[slug]`, `/partners/[slug]`. Listings deferred to next chunk.
5. **Public listings** — index pages with filters, sitemap entries, quiet footer links.
6. **Imagery + seed content** — generate the brand-locked images, apply seed migration, edit two existing guides to use shortcodes pointing at the new entities.
7. **Quiz integration** — `getPractitionersForArchetype` + results-page section.
8. **Final polish** — Playwright pass, design-skill passes (`typeset`, `polish`, `audit`) on the three new templates, commit, push.

The minimum-viable chunk is Chunks 1+2: schema in place, resolvers wired, every existing `{{practitioner:…}}` shortcode in production guides becomes a live link to the (admin-only, for now) detail page. That alone closes the most painful gap. Chunks 3–8 are the public-surface buildout that makes the section a destination.
