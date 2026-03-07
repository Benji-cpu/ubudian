# F11: Events Data Model & Admin CRUD

**Phase:** 4 — Events Directory
**Depends on:** F04
**Blocks:** F12, F13, F14, F15, F16, F17, F18, F21, F26

---

## What

Admin interface for creating, editing, and managing events. This is the data layer that all event views (list, calendar, week) build on.

## Pages

- `src/app/admin/events/page.tsx` — Events list + moderation queue tabs
- `src/app/admin/events/new/page.tsx` — Create event
- `src/app/admin/events/[id]/edit/page.tsx` — Edit event

## Components

- `src/components/admin/event-form.tsx` — Create/edit form

## Spec

### Events Admin List
- Two tabs: "All Events" and "Pending Review" (moderation queue — see F19)
- Table: title, category, date, venue, status, submitted by
- Quick actions: edit, delete, publish/unpublish, cancel
- Filter by: status (all, published, pending, cancelled), category
- Sort by: date (upcoming first), created_at

### Event Form Fields
- Title
- Slug (auto-generated, editable)
- Description (rich text editor)
- Short description (plain text, for card previews — max 200 chars)
- Category (dropdown: dance, tantra, wellness, music, community, food, workshops, retreats)
- Cover image upload (optional)
- Venue name
- Venue address
- Google Maps link (optional)
- Start date + End date (date pickers)
- Start time + End time (time pickers)
- Recurring toggle (see F21 for full recurring logic — basic on/off for now)
- Price info (free text: "Free", "150k IDR", "Donation based")
- External ticket URL (optional — link to Megatix, Eventbrite, etc.)
- Organizer name
- Organizer contact email
- Organizer Instagram (optional)
- Status: draft / published / cancelled

### Validation
- Required: title, description, category, start_date
- Slug must be unique
- Start date must be in the future (for new events)

## Verification

- Create event in admin → appears in admin events list
- Edit event → changes saved
- Delete event works
- Category dropdown populated with all 8 categories
- Image upload works
- Date/time pickers work correctly
