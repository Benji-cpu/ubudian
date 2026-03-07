# F27: Beehiiv API Integration

**Phase:** 6 — Newsletter
**Depends on:** F26
**Blocks:** F29

---

## What

Push composed newsletter content from our admin to Beehiiv for distribution.

## API

- `src/app/api/newsletter/push-to-beehiiv/route.ts` — Push draft to Beehiiv

## Lib

- `src/lib/beehiiv.ts` — Beehiiv API wrapper

## Spec

### Beehiiv API Wrapper
Functions for:
- `createPost(content)` — Create a new post/email draft in Beehiiv
- `addSubscriber(email, metadata)` — Add subscriber (used by F25)
- `getSubscribers()` — Fetch subscriber list for sync
- `getAnalytics(postId)` — Get open/click stats for an edition

### Push to Beehiiv Flow
1. Admin clicks "Push to Beehiiv" in newsletter composer
2. API route takes the `content_json` from our edition
3. Renders it into HTML email format (using a React Email-like template)
4. POST to Beehiiv API: create post with the HTML content
5. Beehiiv creates a draft post
6. Update our edition record with `beehiiv_post_id`
7. Admin goes to Beehiiv to review and schedule/send (or we add a "Send Now" option later)

### HTML Template
- Must match The Ubudian brand (colors, fonts, layout)
- Sections rendered in order: story → weekly flow → bulletin → cultural moment → question → sponsor → tour spotlight
- Responsive email HTML (email clients are finicky — use table-based layout or React Email)
- Unsubscribe link (Beehiiv handles this automatically)

### Why Push to Beehiiv (not send directly)
- Beehiiv handles deliverability, bounces, unsubscribes, compliance
- Our domain has zero sender reputation — Beehiiv's is established
- Free tier: 2,500 subscribers
- Built-in analytics

## Verification

- Push to Beehiiv creates a draft post in Beehiiv dashboard
- Content renders correctly in Beehiiv preview
- beehiiv_post_id saved in our database
- Sending from Beehiiv delivers email to inbox (not spam)
