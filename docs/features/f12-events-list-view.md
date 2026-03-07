# F12: Events List View

**Phase:** 4 — Events Directory
**Depends on:** F11, F02
**Blocks:** F16, F17, F30

---

## What

The default view for the events directory. Card-based list of upcoming events, mobile-optimized.

## Pages

- `src/app/events/page.tsx` — Events directory (list view is default)

## Components

- `src/components/events/event-card.tsx` — Individual event card
- `src/components/events/event-list.tsx` — List layout container

## Spec

### Event Card
- Date badge (left side or top — day number + month abbreviation)
- Title (bold, linked)
- Category badge (colored pill)
- Time: "7:00 PM - 9:00 PM"
- Venue name
- Price info
- Cover image thumbnail (if available)
- "Recurring" indicator if applicable

### List Layout
- Single column on mobile, two columns on desktop
- Sorted by start_date + start_time (soonest first)
- Only shows published events with start_date >= today
- Pagination or infinite scroll (start with showing next 30 days)
- Empty state if no events: "No events this week. Know of one? Submit it!"

### View Switcher
- Tab bar or button group at top: List | Calendar | Week
- Currently active view highlighted
- URL-based: `/events` (list), `/events?view=calendar`, `/events?view=week`
- List is the default

## Verification

- Published events appear in chronological order
- Past events hidden
- Event cards show all key info
- View switcher renders (calendar/week views can be placeholder initially)
- Responsive on mobile
- Empty state works
