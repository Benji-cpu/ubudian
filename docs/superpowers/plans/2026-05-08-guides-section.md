# Guides Section Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a free, opinionated, locally-rooted Guides section at `/guides` — one section, two tiers (practical "Survival Guide" + intent "Why You Came"), cross-linked into events / retreats / stories / quiz.

**Architecture:** One `guides` table with a `tier` discriminator mirrors the `stories` pattern. Two detail templates share the brand voice but differ in layout (slim vs. full-bleed). Cross-linking is handled by markdown shortcodes (`{{event:slug}}`, `{{practitioner:slug}}`, `{{retreat:slug}}`, …) parsed at render time, auto-aggregated into a "Mentioned in this guide" footer. Quiz integration adds `getGuidesForArchetype` to the existing helpers; a separate lightweight 5-tile intent picker on `/guides` filters by `intent_tags`.

**Tech Stack:** Next.js 16 App Router (Server Components by default), Supabase (Postgres + RLS + Storage), Tailwind 4 + shadcn/ui, Vitest + Testing Library, Playwright MCP for visual verification.

**Spec source:** `~/.claude/plans/so-i-want-to-robust-pinwheel.md`

---

## Chunk 1: Foundation — schema, types, constants

### Task 1.1: Migration — `guides` table

**Files:**
- Create: `supabase/migrations/20260508120000_create_guides.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Guides: free, locally-rooted content. Two tiers (practical / intent) sharing one table and one taxonomy surface.

create table guides (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  tier text not null check (tier in ('practical', 'intent')),
  title text not null,
  subtitle text,
  hero_quote text,
  intro_md text,
  body_md text not null,
  intent_tags text[] not null default '{}',
  archetype_tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_members_only boolean not null default false,
  is_editors_pick boolean not null default false,
  editors_pick_position int,
  reading_time_min int,
  hero_image_url text,
  card_image_url text,
  linked_retreat_id uuid references journeys(id) on delete set null,
  related_guide_slugs text[] not null default '{}',
  field_tested_by text,
  last_updated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order int not null default 0
);

create index guides_status_published_at_idx on guides (status, published_at desc);
create index guides_tier_idx on guides (tier);
create index guides_intent_tags_gin on guides using gin (intent_tags);
create index guides_archetype_tags_gin on guides using gin (archetype_tags);

alter table guides enable row level security;

create policy "guides_public_read" on guides
  for select using (status = 'published');
create policy "guides_admin_all" on guides
  for all using (is_admin());

-- updated_at trigger (mirrors pattern used elsewhere in schema)
create trigger guides_set_updated_at
  before update on guides
  for each row execute function set_updated_at();
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Run `mcp__supabase__apply_migration` with name `create_guides` and the SQL above. Verify with `mcp__supabase__list_tables` that `guides` appears with the expected columns and RLS enabled.

- [ ] **Step 3: Smoke-test RLS**

Run `mcp__supabase__execute_sql` as a non-admin role:
```sql
select id from guides where status = 'published';
```
Expected: empty (no rows yet) and no permission error.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260508120000_create_guides.sql
git commit -m "feat(guides): create guides table with RLS and tier discriminator"
```

---

### Task 1.2: TypeScript types

**Files:**
- Modify: `src/types/index.ts` (append at end of content-type block — find existing `Story` interface and add after it)

- [ ] **Step 1: Add types**

```ts
export type GuideTier = 'practical' | 'intent';
export type GuideStatus = 'draft' | 'published' | 'archived';
export type GuideIntent =
  | 'romance'
  | 'community'
  | 'spirit'
  | 'living'
  | 'local_culture';
export type GuideShortcodeKind =
  | 'event'
  | 'practitioner'
  | 'place'
  | 'partner'
  | 'story'
  | 'retreat';

export interface Guide {
  id: string;
  slug: string;
  tier: GuideTier;
  title: string;
  subtitle: string | null;
  hero_quote: string | null;
  intro_md: string | null;
  body_md: string;
  intent_tags: GuideIntent[];
  archetype_tags: ArchetypeId[];
  status: GuideStatus;
  is_members_only: boolean;
  is_editors_pick: boolean;
  editors_pick_position: number | null;
  reading_time_min: number | null;
  hero_image_url: string | null;
  card_image_url: string | null;
  linked_retreat_id: string | null;
  related_guide_slugs: string[];
  field_tested_by: string | null;
  last_updated_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  sort_order: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(guides): add Guide and intent type definitions"
```

---

### Task 1.3: Intent constants and display config

**Files:**
- Create: `src/lib/guides/intents.ts`

- [ ] **Step 1: Write intent registry**

```ts
import type { GuideIntent } from '@/types';

export interface IntentConfig {
  id: GuideIntent;
  label: string;
  blurb: string;          // shown on the picker tile
  imageUrl: string;       // commissioned imagery, not stock
  archetypeAffinity: string[];  // for cross-mapping, optional
}

export const GUIDE_INTENTS: IntentConfig[] = [
  {
    id: 'romance',
    label: 'Romance & Intimacy',
    blurb: 'The Eat-Pray-Love fantasy, honestly. What it actually takes.',
    imageUrl: '/images/guides/intents/romance.jpg',
    archetypeAffinity: ['connector', 'epicurean'],
  },
  {
    id: 'community',
    label: 'Community & Belonging',
    blurb: 'The rooms where Ubud actually meets itself.',
    imageUrl: '/images/guides/intents/community.jpg',
    archetypeAffinity: ['connector', 'seeker'],
  },
  {
    id: 'spirit',
    label: 'Spirit & Practice',
    blurb: 'Separating the real teachers from the costume.',
    imageUrl: '/images/guides/intents/spirit.jpg',
    archetypeAffinity: ['seeker'],
  },
  {
    id: 'living',
    label: 'Living Beautifully',
    blurb: 'The long-stay arithmetic. Spaciousness without spend.',
    imageUrl: '/images/guides/intents/living.jpg',
    archetypeAffinity: ['epicurean', 'creative'],
  },
  {
    id: 'local_culture',
    label: 'Local Culture, Honestly',
    blurb: 'Beyond the cliché, into the relationships.',
    imageUrl: '/images/guides/intents/local-culture.jpg',
    archetypeAffinity: ['explorer', 'seeker'],
  },
];

export function getIntentConfig(intent: GuideIntent): IntentConfig | null {
  return GUIDE_INTENTS.find(i => i.id === intent) ?? null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/guides/intents.ts
git commit -m "feat(guides): add intent registry with display config"
```

---

### Task 1.4: Feature flag

**Files:**
- Modify: `src/lib/feature-flags.ts` (or wherever `SiteSettings` flags currently live — search for `stories_enabled` to find)

- [ ] **Step 1: Add `guides_enabled` boolean (default false in production until content is seeded)**
- [ ] **Step 2: Wire it into `NAV_LINKS` rendering** — if the codebase already filters nav by feature flag, follow that pattern; otherwise leave nav unconditional and rely on the flag at the route level.
- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(guides): add guides_enabled feature flag"
```

---

## Chunk 2: Data layer — queries and shortcode parser (TDD)

### Task 2.1: Query helpers

**Files:**
- Create: `src/lib/guides/queries.ts`
- Test: `src/lib/__tests__/guides/queries.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPublishedGuides,
  getGuideBySlug,
  getEditorsPicks,
  getGuidesByIntent,
  getGuidesByArchetype,
} from '@/lib/guides/queries';

// Mock the Supabase server client; mirror the pattern from stories.test.ts if one exists.
// Tests assert filter shape, ordering, and that drafts are never returned by public queries.
```

Cover at minimum:
- `getPublishedGuides({ tier?, intent?, archetype? })` returns only `status = 'published'`, ordered by `sort_order asc, published_at desc`.
- `getGuideBySlug(slug)` returns a guide; returns null on miss; returns null for unpublished (when called with `publicOnly: true`).
- `getEditorsPicks()` returns only `is_editors_pick = true`, ordered by `editors_pick_position asc`.
- `getGuidesByIntent('romance')` filters by array containment.
- `getGuidesByArchetype('seeker')` filters by archetype array containment.

- [ ] **Step 2: Run tests, confirm all fail**

```bash
npx vitest run src/lib/__tests__/guides/queries.test.ts
```

- [ ] **Step 3: Implement `queries.ts`**

Mirror `src/lib/journeys/queries.ts` (or stories-equivalent) for client construction and pattern. Use the server client (`createServerClient`).

- [ ] **Step 4: Run tests, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add src/lib/guides/queries.ts src/lib/__tests__/guides/queries.test.ts
git commit -m "feat(guides): query helpers with archetype + intent filters"
```

---

### Task 2.2: Shortcode parser

**Files:**
- Create: `src/lib/guides/shortcodes.ts`
- Test: `src/lib/__tests__/guides/shortcodes.test.ts`

A shortcode is `{{kind:slug}}` or `{{kind:slug|card}}` (modifier `card` opts into embedded-card render; default is inline link).

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { parseShortcodes, type ShortcodeNode } from '@/lib/guides/shortcodes';

describe('parseShortcodes', () => {
  it('parses a single inline shortcode', () => {
    const out = parseShortcodes('Visit {{event:tuesday-cacao}} this week.');
    expect(out).toEqual([
      { type: 'text', value: 'Visit ' },
      { type: 'shortcode', kind: 'event', slug: 'tuesday-cacao', modifier: null },
      { type: 'text', value: ' this week.' },
    ]);
  });

  it('parses a card-modifier shortcode', () => {
    const out = parseShortcodes('Body. {{retreat:embodiment-week|card}} more.');
    expect(out[1]).toMatchObject({ kind: 'retreat', slug: 'embodiment-week', modifier: 'card' });
  });

  it('handles multiple shortcodes in one paragraph', () => { /* … */ });
  it('treats malformed shortcodes as text', () => {
    const out = parseShortcodes('Half {{open and {{event:x}} close.');
    // assert no throw, and `{{event:x}}` is parsed correctly
  });
  it('rejects unknown kinds (treats as text)', () => {
    const out = parseShortcodes('Hello {{unknown:foo}} world.');
    expect(out).toEqual([{ type: 'text', value: 'Hello {{unknown:foo}} world.' }]);
  });
  it('returns empty array for empty input', () => {
    expect(parseShortcodes('')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests, confirm fail**
- [ ] **Step 3: Implement `parseShortcodes`**

Pure function, no side effects. Regex: `/\{\{(event|practitioner|place|partner|story|retreat):([a-z0-9-]+)(?:\|(card))?\}\}/g`. Walk the string, build the node array.

- [ ] **Step 4: Run tests, confirm pass**

- [ ] **Step 5: Add shortcode resolver tests** (separate test file for clarity)

`src/lib/__tests__/guides/shortcodes-resolver.test.ts` — mocks DB calls, asserts that `resolveShortcodes(nodes, deps)` returns nodes with hydrated entity data (or marks them as `unresolved` for fallback rendering).

- [ ] **Step 6: Implement `resolveShortcodes`** in the same file. Takes a deps object: `{ getEvent, getStory, getRetreat, ... }` so it's trivially mockable. Concurrency: `Promise.all` over distinct shortcodes, dedup by `kind:slug` to avoid redundant DB hits per guide.

- [ ] **Step 7: Run all shortcode tests, confirm pass**

- [ ] **Step 8: Commit**

```bash
git add src/lib/guides/shortcodes.ts src/lib/__tests__/guides/
git commit -m "feat(guides): markdown shortcode parser and resolver"
```

---

## Chunk 3: Public pages — listing and detail templates

### Task 3.1: Shared components

**Files:**
- Create: `src/components/guides/guide-card.tsx`
- Create: `src/components/guides/intent-rail.tsx`
- Create: `src/components/guides/shortcode-card.tsx`
- Create: `src/components/guides/mentioned-in-guide.tsx`

- [ ] **Step 1: `guide-card.tsx`** — renders one guide card. Variants: `intent-large`, `intent-medium`, `practical-small`. Uses `card_image_url`, `title`, `subtitle`. Practical variant shows last-updated date.

- [ ] **Step 2: `intent-rail.tsx`** — 5-tile horizontal rail driven by `GUIDE_INTENTS`. Each tile links to `/guides?intent=<id>`. Server component; no client state.

- [ ] **Step 3: `shortcode-card.tsx`** — given a resolved shortcode node, renders an inline link OR an embedded card depending on `modifier`. Each kind has its own minimal card (event card already exists; reuse). For unresolved/unknown entities, render styled fallback text.

- [ ] **Step 4: `mentioned-in-guide.tsx`** — given a list of resolved nodes, dedupes and renders a tight grid of small cards in the page footer.

- [ ] **Step 5: Commit**

```bash
git add src/components/guides/
git commit -m "feat(guides): shared card, intent rail, shortcode and mentioned components"
```

---

### Task 3.2: Listing page `/guides`

**Files:**
- Create: `src/app/guides/page.tsx`
- Create: `src/app/guides/loading.tsx` (skeleton)

- [ ] **Step 1: Implement listing page** as a server component:

1. Editorial hero (title + subtitle, single full-bleed image).
2. `<IntentRail />`.
3. Editor's picks rail (`getEditorsPicks` → 3-5 large cards).
4. "Survival Guide" section (`getPublishedGuides({ tier: 'practical' })` → 3-up grid).
5. "Why You Came" section (`getPublishedGuides({ tier: 'intent' })` → 2-up editorial grid).
6. Quiz nudge.

Read `searchParams` for `?intent=` and `?archetype=` — when present, replace the two tier sections with a single filtered grid.

- [ ] **Step 2: Add loading skeleton** mirroring the existing skeleton patterns in `src/components/skeletons/`.

- [ ] **Step 3: Manual smoke test**
  - `npm run dev:next`
  - Visit `http://localhost:4000/guides` (will be empty until content seeded — verify it renders empty states gracefully).

- [ ] **Step 4: Commit**

```bash
git add src/app/guides/
git commit -m "feat(guides): listing page with intent rail and tier sections"
```

---

### Task 3.3: Detail page `/guides/[slug]` with two templates

**Files:**
- Create: `src/app/guides/[slug]/page.tsx` — picks template by tier
- Create: `src/components/guides/practical-guide.tsx`
- Create: `src/components/guides/intent-guide.tsx`

- [ ] **Step 1: Detail page route** — fetches guide, parses + resolves shortcodes, picks template. 404 on miss or unpublished (unless admin).

- [ ] **Step 2: `practical-guide.tsx` — Monocle-coded**
  - Slim hero: card_image_url to the right; title; subtitle; reading time; **last-updated date prominent**.
  - Sticky in-page TOC (extract H2s from body).
  - Single 65ch column body.
  - Inline callout cards rendered from shortcodes (sparingly — modifier `card`).
  - Footer: field-tested-by attribution, last-updated timestamp, link to feedback modal.

- [ ] **Step 3: `intent-guide.tsx` — Cereal/Kinfolk-coded**
  - Full-bleed hero with title overlay + epigraph (`hero_quote`) in italic serif.
  - Long single-column prose.
  - Pull-quotes as full-width slabs (mark in markdown via `> > quote` or a dedicated shortcode — choose: introduce `{{pullquote}}…{{/pullquote}}` if needed).
  - Inline atom cards from shortcodes.
  - "Mentioned in this guide" footer bar.
  - Tail CTAs: linked retreat (if `linked_retreat_id`); "Events for [intent]" link; 2 sibling guides.

- [ ] **Step 4: Manual smoke test** (will need at least one seeded guide of each tier — see Chunk 6).

- [ ] **Step 5: Commit**

```bash
git add src/app/guides/\[slug\]/ src/components/guides/practical-guide.tsx src/components/guides/intent-guide.tsx
git commit -m "feat(guides): detail page with practical + intent templates"
```

---

## Chunk 4: Cross-system wiring — nav, quiz, events tail-CTA

### Task 4.1: Nav entry

**Files:**
- Modify: `src/lib/constants.ts:7-16`

- [ ] **Step 1: Insert Guides between Quiz and Events**

```ts
export const NAV_LINKS = [
  { label: "Quiz", href: "/quiz" },
  { label: "Guides", href: "/guides" },
  { label: "Events", href: "/events" },
  { label: "Ubud Retreats", href: "/experiences" },
  { label: "Humans of Ubud", href: "/stories" },
  { label: "Tours", href: "/tours" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "Membership", href: "/membership" },
  { label: "About", href: "/about" },
] as const;
```

- [ ] **Step 2: Verify desktop and mobile menus pick it up** (no hardcoding expected; both consume `NAV_LINKS`).
- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat(guides): add Guides to top-level nav"
```

---

### Task 4.2: Quiz integration — `getGuidesForArchetype` + results rendering

**Files:**
- Modify: `src/lib/quiz-helpers.ts` (find pattern of `getEventsForArchetype` / `getStoriesForArchetype` / `getExperiencesForArchetype` and add the guides counterpart)
- Modify: `src/app/quiz/results/[archetype]/page.tsx`
- Test: `src/lib/__tests__/quiz-helpers.test.ts` — extend existing test file

- [ ] **Step 1: Add failing test** for `getGuidesForArchetype('seeker')` that asserts published-only, archetype-tag containment, and a sane default limit (e.g. 3).
- [ ] **Step 2: Run test, confirm fail.**
- [ ] **Step 3: Implement `getGuidesForArchetype`** mirroring the existing helpers' shape exactly.
- [ ] **Step 4: Run test, confirm pass.**
- [ ] **Step 5: Wire into results page** — add a "Guides for the [archetype name]" section between existing recommendations. Add a "Browse all guides for [archetype]" link to `/guides?archetype=<id>`.
- [ ] **Step 6: Commit**

```bash
git add src/lib/quiz-helpers.ts src/app/quiz/results/\[archetype\]/page.tsx src/lib/__tests__/quiz-helpers.test.ts
git commit -m "feat(guides): wire archetype-based guide recommendations into quiz results"
```

---

### Task 4.3: Events tail-CTA mapping

**Files:**
- Create: `src/lib/guides/intent-to-event-categories.ts`

For v1 (until events have their own `intent_tags`), map intents to existing event categories:

```ts
import type { GuideIntent } from '@/types';

export const INTENT_TO_EVENT_CATEGORIES: Record<GuideIntent, string[]> = {
  romance: ['Tantra & Intimacy', 'Dance & Movement'],
  community: ['Dance & Movement', 'Ceremony & Sound'],
  spirit: ['Ceremony & Sound', 'Meditation & Embodiment'],
  living: ['Food & Tea', 'Nature & Walks'],
  local_culture: ['Local Culture', 'Ceremony & Sound'],
};

export function eventLinkForIntent(intent: GuideIntent): string {
  const cats = INTENT_TO_EVENT_CATEGORIES[intent].map(encodeURIComponent).join(',');
  return `/events?categories=${cats}`;
}
```

- [ ] **Step 1: Verify the category names match `src/lib/constants.ts` exactly.** If `/events?categories=` filter param doesn't exist, audit the events page filter shape and adjust the function or add `intent_tags` directly to events as a Phase-2 follow-up (out of scope here — flag in MEMORY.md).
- [ ] **Step 2: Use it in `intent-guide.tsx` tail CTA.**
- [ ] **Step 3: Commit**

```bash
git add src/lib/guides/intent-to-event-categories.ts src/components/guides/intent-guide.tsx
git commit -m "feat(guides): tail CTA links intent guides to filtered events"
```

---

## Chunk 5: Admin CRUD

### Task 5.1: Admin list page

**Files:**
- Create: `src/app/admin/guides/page.tsx`
- Modify: `src/lib/constants.ts:35-40` (`ADMIN_GROUPED_ROUTES`) — add `/admin/guides` to the `/admin/content` group

- [ ] **Step 1: Mirror `src/app/admin/stories/page.tsx`** (or `blog/page.tsx`) — table view with status filter, tier filter, edit/delete actions.
- [ ] **Step 2: Add to admin nav grouping.**
- [ ] **Step 3: Manual smoke test** at `/admin/guides` (admin login via `/api/auth/test-login?role=admin`).
- [ ] **Step 4: Commit**

```bash
git add src/app/admin/guides/page.tsx src/lib/constants.ts
git commit -m "feat(guides): admin list page"
```

---

### Task 5.2: Admin create/edit form

**Files:**
- Create: `src/app/admin/guides/new/page.tsx`
- Create: `src/app/admin/guides/[id]/edit/page.tsx`
- Create: `src/components/admin/guide-form.tsx` — Zod + RHF + zodResolver, mirror `blog-form.tsx`
- Create: `src/app/api/admin/guides/route.ts` (POST, GET)
- Create: `src/app/api/admin/guides/[id]/route.ts` (PATCH, DELETE)
- Modify: `src/types/api.ts` — add `CreateGuideSchema`, `UpdateGuideSchema` Zod schemas

- [ ] **Step 1: Zod schemas** — match the DB column shape; arrays for `intent_tags`, `archetype_tags`, `related_guide_slugs`.
- [ ] **Step 2: API routes** — `createAdminClient()`, validate with Zod, return `{ data, error }` shape.
- [ ] **Step 3: Form component** — all fields incl. tier toggle, intent/archetype multi-selects, image uploads to `images/guides/` Storage prefix, markdown body textarea, linked retreat selector (dropdown sourced from published journeys), related-guides multi-input.
- [ ] **Step 4: Test creating a draft, publishing, editing, deleting** through the UI.
- [ ] **Step 5: Commit**

```bash
git add src/app/admin/guides/ src/components/admin/guide-form.tsx src/app/api/admin/guides/ src/types/api.ts
git commit -m "feat(guides): admin create/edit/delete with Zod validation"
```

---

## Chunk 6: Seed content + visual polish

### Task 6.1: Seed one guide per tier

**Files:**
- Through admin UI (do not seed via SQL — content lives in DB and authoring flow is the test).

- [ ] **Step 1: Author "Helmet, the police, and the bribe" (practical).** Hits every practical-template feature: TOC, last-updated date, single inline shortcode (link to a place when one exists, fallback otherwise), field-tested-by attribution.
- [ ] **Step 2: Author "Falling in Love in Ubud" (intent).** Hits every intent-template feature: hero quote, full-bleed image, 2-3 inline shortcode references (events / story / retreat), pull-quote, linked retreat tail CTA, related guides.
- [ ] **Step 3: Source imagery.** Original or commissioned only — `images/guides/` Storage prefix. If unavailable, ship with fewer images, not stock.
- [ ] **Step 4: Source intent-rail tile imagery** — 5 tiles. Same constraint.

---

### Task 6.2: Visual verification with Playwright MCP

- [ ] **Step 1: Test login as admin** — `mcp__playwright__browser_navigate` to `http://localhost:4000/api/auth/test-login?role=admin`.
- [ ] **Step 2: Screenshot listing page** — desktop (1440px) and mobile (390px). Verify intent rail, editor's picks, both tier sections render.
- [ ] **Step 3: Screenshot one practical detail and one intent detail** — desktop + mobile. Verify shortcodes resolve, "Mentioned in this guide" footer aggregates correctly, tail CTAs link correctly.
- [ ] **Step 4: Screenshot quiz results** — verify Guides recommendation section appears.

---

### Task 6.3: Design-skill polish passes

Apply in this order if anything looks rough:

- [ ] `typeset` skill on both detail templates (hierarchy, sizing, weight).
- [ ] `layout` skill on the listing page (intent rail spacing, tier section rhythm).
- [ ] `polish` skill final pass (alignment, micro-detail).
- [ ] `audit` skill — accessibility + performance + image-weight on the heaviest intent guide.

If `audit` flags P0/P1 issues, fix before proceeding.

---

### Task 6.4: Enable feature flag and ship

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: pass. The Stop hook also runs this.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

- [ ] **Step 3: Flip `guides_enabled` flag in production `SiteSettings`.**

- [ ] **Step 4: Final commit + push**

```bash
git status
git add -A
git commit -m "feat(guides): seed launch content + visual polish"
git push origin main
```

- [ ] **Step 5: Verify Vercel deploy** via `mcp__vercel__getDeployments` — confirm it ships green.

- [ ] **Step 6: Production smoke test** at `https://ubudian-v1.vercel.app/guides`.

---

## Out of Scope (Phase 2 — flag in MEMORY.md when shipping)

- `practitioners`, `places`, `partners` tables — shortcodes for these kinds resolve to free-text fallback in v1.
- `intent_tags` column on `events` — v1 uses the `INTENT_TO_EVENT_CATEGORIES` mapping; tagging events natively is a follow-up.
- Reverse cross-link rendering ("Mentioned in [guide]" on event/practitioner pages).
- Members-only guide gating (column exists; no UI yet).
- Translation / localisation.
- Renaming `experiences → retreats` at route/DB level (explicitly excluded by user).

---

## Verification (full pass before declaring done)

1. Migration applied; RLS verified by selecting from non-admin role.
2. `npm test` passes (incl. shortcode parser, queries, quiz helper).
3. `npm run lint` passes.
4. Listing page renders both sections; intent rail filter works.
5. Practical detail and intent detail render distinctly with all features above.
6. Shortcodes resolve to live cards; unresolved fall back gracefully.
7. Quiz results page shows Guides section.
8. Nav entry visible on desktop + mobile.
9. Admin CRUD works end-to-end.
10. Playwright screenshots captured at desktop + mobile for every key page; visual register matches the editorial-luxury / lush-not-hippie standard.
11. Vercel deploy green; production smoke-tested.
