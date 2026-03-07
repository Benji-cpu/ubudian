# F18: Public Event Submission

**Phase:** 4 — Events Directory
**Depends on:** F11
**Blocks:** F19, F20

---

## What

Public-facing form where anyone can submit an event for review. No login required.

## Pages

- `src/app/submit-event/page.tsx` — Submission form

## API

- `src/app/api/events/submit/route.ts` — Handles form submission

## Components

- `src/components/events/event-submission-form.tsx` — The form

## Spec

### Form Fields
- Event title (required)
- Description (required, rich text or textarea)
- Category (required, dropdown)
- Venue name
- Venue address
- Google Maps link
- Date (required), End date (optional)
- Start time, End time
- Is this a recurring event? (checkbox) — if yes: recurrence pattern (weekly/monthly + day)
- Price info (free text)
- External ticket/booking URL
- Organizer name (required)
- Organizer email (required)
- Organizer Instagram
- Cover image upload (optional)
- Submitter email (required — for moderation communication)

### Submission Flow
1. User fills form
2. Client-side validation
3. POST to `/api/events/submit`
4. API creates event with `status: 'pending'`
5. Success message: "Thanks! Your event has been submitted for review. We'll notify you once it's approved."
6. (Optional) Send confirmation email to submitter via Resend
7. (Optional) Send notification email to admin: "New event submission: [title]"

### Submission Guidelines
- Clear text above form explaining:
  - Events must be real, happening in or near Ubud
  - No misleading descriptions
  - You'll be notified when approved/rejected
  - Submissions typically reviewed within 24 hours

### Spam Prevention
- Honeypot field (hidden input — if filled, reject)
- Rate limiting on API route
- Basic email validation

## Verification

- Form renders with all fields
- Submit with valid data → success message
- Event appears in admin moderation queue (F19) with status `pending`
- Submit with missing required fields → validation errors
- Honeypot field blocks spam submissions
