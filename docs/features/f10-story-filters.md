# F10: Story Theme Filtering

**Phase:** 3 — Humans of Ubud
**Depends on:** F09
**Blocks:** None

---

## What

Filter stories on the hub page by theme tag.

## Components

- `src/components/stories/theme-filter.tsx` — Tag filter bar

## Spec

- Horizontal scrollable tag bar at top of hub page
- Tags: All | Transformation | Reinvention | Healer | Creative | Challenge | Connector | Long-Timer | Couple | Return
- Click a tag → filters stories to only those with that theme_tag
- "All" shows everything (default)
- Client-side filtering (stories are already loaded) or URL param based (?theme=healer)
- Active tag highlighted with brand color

## Verification

- All filter tags render
- Clicking a tag filters stories correctly
- "All" resets to show everything
- Works on mobile (horizontal scroll)
