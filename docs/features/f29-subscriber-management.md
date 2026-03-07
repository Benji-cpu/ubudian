# F29: Subscriber Management

**Phase:** 6 — Newsletter
**Depends on:** F27, F04
**Blocks:** None

---

## What

Admin view of newsletter subscribers with basic stats. Data lives in Beehiiv (source of truth) with a mirror in our database.

## Pages

- `src/app/admin/subscribers/page.tsx` — Subscriber list + stats

## API

- `src/app/api/webhooks/beehiiv/route.ts` — Webhook for subscriber sync (if Beehiiv supports it)

## Spec

### Subscriber Admin Page
- Key stats: total subscribers, new this week, new this month
- Simple growth chart (subscribers over time)
- Table: email, first name, birthday, Instagram, subscribed date, source
- Search by email/name
- Export CSV button
- Manual add subscriber form (for in-person signups)

### Data Sync
- Source of truth: Beehiiv (they manage unsubscribes, bounces, etc.)
- Our mirror table: updated via:
  - On new signup through our site: we write to both Beehiiv and our table
  - Periodic sync: API call to Beehiiv to fetch full subscriber list (daily cron or manual button)
  - (Optional) Beehiiv webhook: real-time sync on subscribe/unsubscribe events

### Birthday + Instagram Data
- Collected optionally during signup or via a separate "Update your profile" form
- Stored in our `newsletter_subscribers` table
- Used for newsletter birthday features
- Admin can filter: "Birthdays this week" for newsletter composition

## Verification

- Subscriber list shows data from our mirror table
- Stats calculate correctly
- CSV export works
- Manual add creates subscriber in both Beehiiv and our table
- Sync button updates our table from Beehiiv
