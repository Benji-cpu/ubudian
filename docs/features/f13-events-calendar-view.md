# F13: Events Calendar View

**Phase:** 4 — Events Directory
**Depends on:** F11
**Blocks:** None

---

## What

Monthly calendar grid view for the events directory.

## Components

- `src/components/events/event-calendar.tsx` — Monthly calendar grid

## Spec

- Monthly grid (7 columns: Mon-Sun)
- Month/year header with prev/next arrows
- Days with events show colored dots (one per category) or event count badge
- Click a day → expands to show that day's events (mini event cards below calendar, or a popover)
- Current day highlighted
- Navigate between months
- URL param: `/events?view=calendar&month=2026-02`

## Verification

- Calendar renders current month
- Days with events show indicators
- Clicking a day shows that day's events
- Month navigation works
- Responsive (consider stacked layout on mobile)
