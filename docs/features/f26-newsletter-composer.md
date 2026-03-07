# F26: Newsletter Composer (Admin)

**Phase:** 6 — Newsletter
**Depends on:** F04, F08, F11, F22
**Blocks:** F27, F28

---

## What

Admin interface for composing weekly newsletters with structured sections.

## Pages

- `src/app/admin/newsletter/page.tsx` — Editions list
- `src/app/admin/newsletter/new/page.tsx` — Compose new edition

## Components

- `src/components/admin/newsletter-composer.tsx` — Section-based editor

## Spec

### Composer Sections

The newsletter has a defined structure. Each section has its own editor within the composer:

1. **Subject Line** — Text input
2. **Preview Text** — Short text (shown in email clients before opening)
3. **Humans of Ubud Story** — Dropdown to select a published story + auto-populates excerpt + edit excerpt text
4. **The Weekly Flow** — Select events from published events list + rich text narrative weaving them together
5. **Community Bulletin** — Rich text: birthdays, shoutouts, community needs
6. **Cultural Moment** — Rich text: Balinese calendar, ceremonies
7. **Weekly Question** — Text input for this week's question + rich text for last week's featured responses
8. **Sponsor Slot** — Sponsor name, image upload, URL, description text
9. **Tour Spotlight** — Select from active tours + CTA text

### Composer Features
- Section-by-section editor (accordion or tab-based)
- Preview mode: renders the full newsletter as subscribers would see it
- Save as draft
- Slug auto-generated from subject line
- Content saved as `content_json` (JSONB — each section as a key)
- Also generates `html_content` for web archive rendering

### Editions List
- Table: subject, status (draft/sent), sent_at or created_at
- Quick actions: edit draft, view preview, delete

## Verification

- Create new edition with all sections filled
- Preview renders correctly
- Save as draft → appears in editions list
- Edit existing draft
- Content persists across page reloads
