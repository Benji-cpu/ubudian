# F25: Newsletter Subscriber Signup

**Phase:** 6 — Newsletter
**Depends on:** F02
**Blocks:** F29

---

## What

Newsletter signup form that pushes subscribers to Beehiiv. Appears on multiple pages.

## API

- `src/app/api/newsletter/subscribe/route.ts` — Handles signup → Beehiiv API

## Spec

### Signup Form (reusable component from F02)
- Fields: email (required), first name (optional)
- Submit → POST to `/api/newsletter/subscribe`
- Success: "Welcome to The Ubudian! Check your inbox."
- Error: validation message or "Something went wrong, try again"

### API Route Logic
1. Validate email
2. POST to Beehiiv API: create subscriber
3. Also save to our `newsletter_subscribers` table (mirror)
4. Return success/error

### Beehiiv Integration
- Beehiiv API endpoint: `POST /v2/publications/{pub_id}/subscriptions`
- Required fields: email
- Optional: first name, custom fields
- API key from env var

### Where It Appears
- Landing page hero section
- Footer (every page)
- Bottom of blog posts
- Bottom of Humans of Ubud stories
- Newsletter archive page
- About page

### Duplicate Handling
- If email already exists in Beehiiv: API returns existing subscriber (no error)
- Our mirror table: upsert on email

## Verification

- Submit email → subscriber created in Beehiiv (check Beehiiv dashboard)
- Subscriber also saved in our database
- Duplicate email doesn't error
- Form appears on all required pages
- Success/error states display correctly
