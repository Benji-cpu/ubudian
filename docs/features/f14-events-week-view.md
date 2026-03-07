# F14: Events Week View

**Phase:** 4 — Events Directory
**Depends on:** F11
**Blocks:** None

---

## What

7-day timeline view for the events directory. Shows what's happening each day of the current week.

## Components

- `src/components/events/event-week-view.tsx` — Week timeline

## Spec

- 7 columns (or 7 rows on mobile) for each day of the week
- Each day shows: day name, date, and stacked event cards
- Events positioned by time (morning/afternoon/evening groupings or actual time slots)
- Prev/next week navigation arrows
- Current day highlighted
- URL param: `/events?view=week&week=2026-02-10`
- Mobile: stack days vertically (scrollable)

## Verification

- Week view shows 7 days
- Events appear on correct days
- Week navigation works
- Current day highlighted
- Responsive (horizontal → vertical on mobile)
