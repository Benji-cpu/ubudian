# F08: Stories CRUD & Admin

**Phase:** 3 — Humans of Ubud
**Depends on:** F04
**Blocks:** F09, F26

---

## What

Admin interface for creating, editing, and managing Humans of Ubud stories.

## Pages

- `src/app/admin/stories/page.tsx` — Stories list
- `src/app/admin/stories/new/page.tsx` — Create story
- `src/app/admin/stories/[id]/edit/page.tsx` — Edit story

## Components

- `src/components/admin/story-form.tsx` — Create/edit form

## Spec

### Stories Admin List
- Table: title, subject name, theme tags, status, published date
- Quick actions: edit, delete, toggle draft/published
- Filter by status (all, draft, published)

### Story Form Fields
- Title (for the story, e.g. "The Breathwork Teacher Who Left Corporate London")
- Subject name
- Subject Instagram handle
- Subject tagline (one-liner: "Facilitator, dreamer, reluctant yogi")
- Photo upload (multiple — 2-4 photos, with drag-to-reorder)
- Narrative (rich text editor, target 800-1,200 words)
- Theme tags (multi-select from: transformation, reinvention, healer, creative, challenge, connector, long-timer, couple, return)
- Slug (auto-generated, editable)
- SEO fields: meta title, meta description
- Status: draft / published

### Validation
- Required: title, subject_name, narrative, at least 1 photo, at least 1 theme tag
- Slug must be unique

## Verification

- Create a story in admin with photos and content
- Story appears in admin list
- Edit and save changes
- Delete works
- Draft stories don't appear on public pages
