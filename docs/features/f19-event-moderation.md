# F19: Event Moderation Queue

**Phase:** 4 — Events Directory
**Depends on:** F18, F04
**Blocks:** F20

---

## What

Admin interface for reviewing and approving/rejecting community-submitted events.

## Components

- `src/components/admin/moderation-queue.tsx` — Moderation UI

## Spec

### Moderation Queue (tab within admin events page)
- List of events with `status: 'pending'`
- Sorted by event date (soonest first — urgent submissions at top)
- Each item shows: title, category, date, venue, submitter email, submitted_at
- Expandable to see full description

### Actions per Event
- **Approve** → sets status to `published`, event appears in public directory
- **Reject** → sets status to `rejected`, optionally with rejection reason
- **Edit & Approve** → opens event in edit form, save as published
- (Optional) Send email to submitter on approve: "Your event [title] is now live on The Ubudian!"
- (Optional) Send email to submitter on reject: "Your event [title] wasn't approved. Reason: [reason]"

### Admin Events Page Tabs
- "All Events" — everything
- "Pending Review" — moderation queue (with count badge)
- "Published" — live events
- "Rejected / Cancelled"

## Verification

- Pending submissions appear in moderation queue
- Approve → event appears in public directory
- Reject → event disappears from queue, doesn't appear publicly
- Count badge updates correctly
- Edit & approve flow works
