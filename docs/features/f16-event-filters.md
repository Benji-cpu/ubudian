# F16: Event Category Filters

**Phase:** 4 — Events Directory
**Depends on:** F12
**Blocks:** None

---

## What

Category filter tabs and date filters on the events directory.

## Components

- `src/components/events/event-filters.tsx` — Filter bar

## Spec

### Category Tabs
- Horizontal scrollable tab bar:
  All | Dance | Tantra & Intimacy | Wellness & Yoga | Music & Performance | Community & Social | Food & Dining | Workshops & Learning | Retreats
- Click a category → filters events to that category
- "All" shows everything (default)
- Active tab highlighted with brand color
- URL param: `/events?category=dance`

### Date Filter
- Date range picker or quick buttons: "Today" | "This Week" | "This Weekend" | "This Month"
- URL param: `/events?from=2026-02-10&to=2026-02-16`

### Free / Paid Toggle (optional)
- Small toggle or checkbox: "Free events only"
- Filters based on price_info containing "Free" or similar

### Combined Filtering
- All filters composable: `/events?category=dance&from=2026-02-10&to=2026-02-16`
- Filters persist across view mode switches (list/calendar/week)

## Verification

- Category tabs filter events correctly
- Date filters work
- Combined filters work
- Filters persist when switching views
- Horizontal scroll works on mobile
