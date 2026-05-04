# The Ubudian: UX Improvements Design Spec

**Date:** 2026-04-11
**Goal:** Complete the discovery-to-action loop, reduce UX friction, and sharpen the app's value proposition across 10 tasks.

---

## Task 1: Event Action Bridge

### Problem

The app gets users to "I found an interesting event" and then stops. The gap between discovery and physically attending is where value is lost. Event data like `venue_map_url`, `external_ticket_url`, and `organizer_instagram` already exists in the database but is either invisible on cards or requires clicking through to the detail page. There's no calendar export, no clear "how to attend" guidance, and saving an event gives no visual feedback about where it went.

### Current State

**Event cards** (`src/components/events/event-card.tsx`, `event-grid-card.tsx`) show: title, category badge, date, time, venue name, organizer name, price. They do NOT show: venue_map_url, external_ticket_url, organizer_contact, organizer_instagram. Save button slot exists but is optional.

**Event detail page** (`src/app/events/[slug]/page.tsx`) shows more: full description, "View on Maps" link (if `venue_map_url`), "Get Tickets" button (if `external_ticket_url`), organizer Instagram link, share buttons. But there's no calendar export (ICS), no "how to attend" guidance, and no save button.

**Event type** (`src/types/index.ts`, lines 51-90) has all the fields needed: `venue_name`, `venue_address`, `venue_map_url`, `external_ticket_url`, `price_info`, `organizer_name`, `organizer_contact`, `organizer_instagram`, `start_date`, `start_time`, `end_date`, `end_time`.

### Solution

**A. Add "Add to Calendar" button on event detail page.**
Generate an ICS file on-the-fly from event data (`start_date`, `start_time`, `end_date`, `end_time`, `title`, `venue_name`, `venue_address`). Render as a download button with a Calendar icon next to the share buttons. Create a utility function `generateICS(event: Event): string` in `src/lib/calendar.ts`. No external dependencies needed — ICS is a simple text format.

**B. Add save button to event detail page.**
The `SaveEventButton` component already exists (`src/components/events/save-event-button.tsx`). Add it to the detail page alongside the share buttons. When clicked, show a brief toast: "Saved! View in your Dashboard."

**C. Add "How to Attend" section on event detail page.**
Below the price info, render a contextual attendance guide:
- If `external_ticket_url` exists: "Registration required" + ticket button
- If `price_info` exists and no ticket URL: "Walk-in welcome. [Price info]."
- If no price and no ticket URL: "Walk-in welcome. Free event."
- Always show venue details (name, address, map link) in a compact card format

This is a new component `AttendanceInfo` in `src/components/events/attendance-info.tsx`. It reads existing event fields and renders guidance — no new data required.

**D. Surface key action fields on event cards.**
On both list and grid cards, add small icon-links when data exists:
- Map pin icon → `venue_map_url` (opens Google Maps)
- Ticket icon → `external_ticket_url` (opens external URL)
These should be subtle (icon-only, muted color) so they don't clutter the card.

### Affected Files

- `src/lib/calendar.ts` — new file, ICS generation utility
- `src/app/events/[slug]/page.tsx` — add calendar button, save button, AttendanceInfo
- `src/components/events/attendance-info.tsx` — new component
- `src/components/events/event-card.tsx` — add icon-links for map/tickets
- `src/components/events/event-grid-card.tsx` — add icon-links for map/tickets

### Acceptance Criteria

- [ ] Event detail page has an "Add to Calendar" button that downloads a valid .ics file
- [ ] ICS file opens correctly in Apple Calendar, Google Calendar
- [ ] Event detail page has a save button (uses existing SaveEventButton)
- [ ] Saving shows a toast with "View in your Dashboard" message
- [ ] Event detail page shows contextual "How to Attend" guidance
- [ ] Event cards show map/ticket icon-links when data exists
- [ ] All new elements are responsive (mobile + desktop)
- [ ] No new database queries or schema changes required

### Dependencies

None. Fully independent.

---

## Task 2: Social Proof & Community Signals

### Problem

Every event, story, and tour looks equally weighted. A new user can't tell what's popular, what's trending, or what was just added. The `saved_events` table and `created_at` timestamps already contain the data needed for social proof, but it's not surfaced anywhere.

### Current State

**`saved_events` table** (`supabase/schema.sql`): stores `user_id` + `event_id` pairs. A count query (`SELECT event_id, COUNT(*) FROM saved_events GROUP BY event_id`) gives save popularity.

**Events** have `created_at` timestamps. Events added in the last 7 days are "new."

**No aggregate data is currently displayed.** No save counts, no "new" badges, no "popular" signals anywhere in the app.

### Solution

**A. "New" badge on event cards.**
If `created_at` is within the last 7 days, render a small "New" badge (gold background, small text) on the event card. This is a pure front-end calculation — compare `created_at` to `Date.now()`. Add to both `event-card.tsx` and `event-grid-card.tsx`.

**B. Save count on event detail page.**
On the event detail page, show "[N] people saved this" next to the save button. This requires a single Supabase query: `saved_events.select('id', { count: 'exact' }).eq('event_id', event.id)`. Show only if count > 0. Display as muted text with a heart icon.

**C. "Popular This Week" section on events page.**
Above the main event list, add an optional section showing the top 3-5 most-saved events from the current week. Query: events with the most `saved_events` entries where `saved_events.created_at` is within the last 7 days. Only show this section if there are events with 3+ saves. Render as a horizontal scroll of compact cards.

**D. "Just Added" filter chip on events page.**
Add a "Just Added" date filter option alongside Today/Tomorrow/This Week etc. Filters to events where `created_at` is within the last 48 hours, regardless of event date. This helps the returning-resident user segment see what's new without scanning everything.

### Affected Files

- `src/components/events/event-card.tsx` — add "New" badge
- `src/components/events/event-grid-card.tsx` — add "New" badge
- `src/app/events/[slug]/page.tsx` — add save count query + display
- `src/app/events/page.tsx` — add "Popular This Week" section, "Just Added" filter
- `src/components/events/event-filters.tsx` — add "Just Added" chip

### Acceptance Criteria

- [ ] Events created in the last 7 days show a "New" badge on cards
- [ ] Event detail page shows save count when > 0
- [ ] Events page has a "Popular This Week" section when qualifying events exist
- [ ] "Just Added" filter chip works correctly
- [ ] All queries are efficient (indexed columns, no N+1)
- [ ] Graceful degradation: sections hide when no data qualifies

### Dependencies

None. Fully independent.

---

## Task 3: Quiz as Primary Entry Point

### Problem

The quiz is the most original and differentiated feature of the platform — no competitor does personality-based matching for wellness events. But it's positioned as one feature among many. First-time visitors see the full homepage and may never reach the quiz CTA (section 4 of 7 in the scroll sequence). The quiz should be the front door for new visitors, not a discovery buried mid-scroll.

### Current State

**Quiz entry points:**
1. Homepage hero — small inline link ("Six questions. Your Ubud, sorted →")
2. Homepage section 4 — `QuizCtaHomepage` with "Find My Fit" button (only shown to users without localStorage result)
3. Top-level nav link "Quiz"

**Quiz flow** (`src/components/quiz/quiz-container.tsx`): intro → 6 questions → email capture → results. Takes ~90 seconds. Results stored in localStorage (`ubudian_quiz_result`). Returning users skip to results.

**Homepage** (`src/app/page.tsx`): 7 scroll-snap sections. Quiz CTA is section 4 — after hero, events, and stories. Many users will bounce before reaching it.

### Solution

**A. First-visit quiz interstitial on homepage.**
For users without `localStorage["ubudian_quiz_result"]`, show a prominent interstitial overlay after 3-5 seconds on the homepage (or after scrolling past the hero). Not a modal that blocks content — a slide-up card at the bottom of the viewport (similar to a cookie banner but more inviting).

Content: "New to Ubud? Take 90 seconds to find your vibe." + "Find My Fit" button + "Maybe later" dismiss. Dismissing stores `localStorage["ubudian_quiz_dismissed"] = "true"` so it doesn't reappear.

This is a new client component `QuizPrompt` in `src/components/quiz/quiz-prompt.tsx`, rendered in `layout.tsx` or the homepage.

**B. Move quiz CTA to homepage section 2 (after hero, before events).**
Currently the homepage sequence is: Hero → Events → Stories → Quiz CTA → Experiences → Tours → Newsletter. Move Quiz CTA to position 2: Hero → Quiz CTA → Events → Stories → Experiences → Tours → Newsletter. The quiz becomes the first action the user is prompted to take after the hero sets the scene.

**C. Enhance quiz CTA copy with concrete value proposition.**
Current: "Like What You See? Let Us Personalize It." + "Find My Fit"
Better: "Tell us who you are. We'll show you YOUR Ubud." + "Take the 90-Second Quiz" + small text: "Get personalized event, tour, and experience recommendations."

This makes the payoff concrete before the user commits.

**D. Post-quiz: redirect to personalized events page.**
After completing the quiz, instead of showing results inline on `/quiz`, redirect to `/events?archetype=[id]` (or `/quiz/results/[archetype]` which already exists). The key change: the results page should feel like a personalized home base, not a quiz result. "Your Ubud, sorted" should be the literal experience — a filtered view of the platform through their archetype lens.

The existing results page (`/quiz/results/[archetype]`) already shows matched events, experiences, tours, and stories. It just needs a clearer CTA to continue browsing: "Browse all events for Seekers →" linking to `/events?archetype=seeker`.

### Affected Files

- `src/components/quiz/quiz-prompt.tsx` — new component (first-visit interstitial)
- `src/app/page.tsx` — reorder sections, add QuizPrompt
- `src/components/homepage/quiz-cta-homepage.tsx` — update copy
- `src/components/quiz/quiz-container.tsx` — adjust post-quiz redirect
- `src/app/events/page.tsx` — support `?archetype=` filter param (filter by `archetype_tags`)

### Acceptance Criteria

- [ ] First-time visitors see a non-blocking quiz prompt after a few seconds on homepage
- [ ] Prompt is dismissable and doesn't reappear after dismissal
- [ ] Quiz CTA appears as section 2 on homepage (after hero)
- [ ] Quiz CTA copy communicates concrete value (personalized recommendations)
- [ ] Events page supports `?archetype=` param for filtered view
- [ ] Quiz result page links to archetype-filtered events
- [ ] Returning visitors (localStorage result exists) skip the prompt and see the compact banner
- [ ] Mobile and desktop responsive

### Dependencies

None, but pairs well with Task 2 (social proof makes the personalized event view more compelling).

---

## Task 4: Unify Events + Experiences in Navigation

### Problem

Users encounter three content types for "things to do": Events (scheduled, specific), Experiences (evergreen guides to practices), and Tours (guided outings). Events vs. Experiences is the confusing pair — "Is a breathwork session an Event or an Experience?" The conceptual distinction (Events = specific scheduled instances, Experiences = evergreen editorial guides to practice types) serves the database but confuses the user.

### Current State

**Experiences** are editorial content — no dates, no venues, no prices. They describe what a practice IS (e.g., "Ecstatic Dance") and link to upcoming Events of the same category.

**Experience detail pages** (`src/app/experiences/[slug]/page.tsx`) already cross-link to events: "Upcoming [Category] Events" section fetches up to 6 approved events matching the experience's category.

**Navigation** treats them as separate sections: Events and Experiences are both in `NAV_LINKS`. They appear as separate homepage sections (Events = section 2, Experiences = section 5).

### Solution

**Do NOT merge the database tables or delete Experiences.** They serve a genuinely different purpose (evergreen guide vs. scheduled event). Instead, make the navigation relationship clear.

**A. Rename "Experiences" to "Guides" or "Practice Guides" in navigation.**
This name makes it clear these are informational, not events. Update `NAV_LINKS` in `src/lib/constants.ts` and all references.

**B. Add experience/guide links within event category filters.**
On the events page, when a user selects a category (e.g., "Dance & Movement"), show a subtle link: "What is Dance & Movement in Ubud? Read the guide →" linking to the matching experience. This creates a natural discovery path from events → guides.

Query: find the experience whose `category` matches the selected filter. If one exists, show the link.

**C. Add "Browse [Category] Events" CTA more prominently on experience detail pages.**
The existing cross-link exists but is at the bottom. Add a prominent CTA button after the description: "See upcoming [Category] events →" linking to `/events?category=[category]`. Make it visually prominent (gold button).

**D. On the homepage, nest Experiences within or adjacent to Events.**
Currently: Events (section 2) ... Experiences (section 5). Move Experiences to section 3 (right after Events) and reframe the heading: "Go Deeper" or "Understand the Practices" — making it clear these are companion content to the events, not a separate product.

### Affected Files

- `src/lib/constants.ts` — rename "Experiences" in NAV_LINKS
- `src/components/events/event-filters.tsx` — add guide link per category
- `src/app/experiences/[slug]/page.tsx` — add prominent events CTA
- `src/app/page.tsx` — reorder homepage sections
- `src/components/layout/mobile-menu.tsx` — reflects NAV_LINKS change automatically
- `src/components/layout/header.tsx` — reflects NAV_LINKS change automatically

### Acceptance Criteria

- [ ] "Experiences" renamed to "Guides" (or approved alternative) in all navigation
- [ ] Events page shows guide link when a category filter is active and a matching guide exists
- [ ] Experience/guide detail pages have a prominent "Browse events" CTA
- [ ] Homepage sections reordered: Events → Guides → Stories (or approved order)
- [ ] No database changes required
- [ ] All existing experience URLs (`/experiences/[slug]`) continue to work

### Dependencies

None. Fully independent.

---

## Task 5: Connect Stories to Events

### Problem

Humans of Ubud stories profile facilitators, healers, and practitioners. Those same people often run events. But there's no link between a story about a breathwork facilitator and their upcoming breathwork events. The platform has two content types that should create a virtuous loop (stories build trust → trust drives event attendance → events create story-worthy experiences) but they're currently siloed.

### Current State

**Stories** (`src/types/index.ts`): have `title`, `author_name`, `theme_tags[]`, `archetype_tags[]`. No field linking to an event organizer or a user profile.

**Events**: have `organizer_name`, `organizer_contact`, `organizer_instagram`. No field linking to a story.

**No relational link exists** between stories and events/organizers. The only shared data point is potentially `organizer_name` matching `author_name` (or the subject's name in the story), but this is unreliable free-text matching.

### Solution

**A. Add `related_organizer_name` field to stories table.**
New nullable text column on `stories`: `related_organizer_name`. When an admin creates/edits a story about a facilitator, they can optionally fill in the organizer name as it appears in events. This enables a direct query: `events.where(organizer_name = story.related_organizer_name)`.

Migration: `ALTER TABLE stories ADD COLUMN related_organizer_name TEXT;`

**B. Show "Upcoming Events by [Name]" on story detail pages.**
On `/stories/[slug]`, if `related_organizer_name` is set, query upcoming approved events where `organizer_name ILIKE related_organizer_name` and display them in a section: "Upcoming Events by [Name]". Render using existing `EventCard` components. Limit to 4 events.

**C. Show "Meet the Facilitator" on event detail pages.**
On `/events/[slug]`, if `organizer_name` is set, query stories where `related_organizer_name ILIKE organizer_name`. If a match exists, show a compact card: facilitator's story image + "Read [Name]'s Story →" linking to the story. Place this in the organizer section of the event detail page.

**D. Admin: add the field to story editing forms.**
In whatever admin form is used to create/edit stories, add a text input for "Related Organizer Name" with helper text: "Enter the organizer name as it appears in their event submissions. This links the story to their upcoming events."

### Affected Files

- `supabase/migrations/YYYYMMDD_add_related_organizer_to_stories.sql` — new migration
- `src/types/index.ts` — add `related_organizer_name` to Story type
- `src/app/stories/[slug]/page.tsx` — add upcoming events section
- `src/app/events/[slug]/page.tsx` — add "Meet the Facilitator" section
- Admin story form (location TBD — check `src/app/admin/stories/` or `src/components/admin/`)

### Acceptance Criteria

- [ ] Stories table has `related_organizer_name` column
- [ ] Story detail pages show upcoming events by the related organizer (when set)
- [ ] Event detail pages show a "Meet the Facilitator" link to the organizer's story (when match exists)
- [ ] Admin can set `related_organizer_name` when editing stories
- [ ] ILIKE matching handles case differences
- [ ] Sections hide gracefully when no matches exist

### Dependencies

None. Fully independent.

---

## Task 6: Archetype-Aware Newsletter

### Problem

The newsletter is the primary retention mechanism — a weekly email that brings users back. But it's the same content for everyone. The archetype system already segments users (Seeker, Explorer, Creative, Connector, Epicurean) and the quiz flow already syncs archetype to Beehiiv as a custom field (`"Ubud Spirit": "seeker"`). But this segmentation is never used. A Seeker gets the same newsletter as an Epicurean.

### Current State

**Quiz submit** (`src/app/api/quiz/submit/route.ts`): calls `addSubscriberWithArchetype(email, archetype)` which syncs to Beehiiv with custom field `"Ubud Spirit": archetype`.

**Direct newsletter signup** (`src/app/api/newsletter/subscribe/route.ts`): calls `addSubscriber(email)` WITHOUT archetype. These subscribers have no archetype in Beehiiv.

**`newsletter_subscribers` table**: has `archetype` column, populated only via quiz flow.

**Beehiiv**: subscribers have custom field `"Ubud Spirit"` when they came through the quiz. Beehiiv supports segment-based sends (filter by custom field value).

**No personalization logic exists** in the app for newsletter content.

### Solution

This task has two parts: (A) ensure all subscribers can have an archetype, and (B) provide tools for archetype-segmented content.

**A. Prompt non-archetyped subscribers to take the quiz.**
In the newsletter signup confirmation flow (the welcome email sent via Resend), add a line: "Want personalized event recommendations? Take the 90-second Ubud Spirit Quiz: [link to /quiz]". This converts direct subscribers into archetyped subscribers over time.

Also: on the newsletter page (`src/app/newsletter/page.tsx`), after the signup form, add a note: "Already subscribed? Take the quiz to get personalized picks in your weekly email."

**B. Create a newsletter preview API that generates archetype-specific event recommendations.**
New API route: `GET /api/newsletter/recommendations?archetype=seeker`

Returns the top 5-8 upcoming events matched to the given archetype (using the same matching logic from `src/lib/quiz-helpers.ts`: check `archetype_tags`, fall back to category/keyword matching). This endpoint can be called by the newsletter authoring workflow (or by Beehiiv via webhook/automation) to generate personalized content blocks.

**C. Add archetype to direct newsletter signups when available.**
If a user signs up for the newsletter AND has a localStorage quiz result (or is logged in with a quiz result in the DB), include their archetype in the Beehiiv sync. Modify `src/app/api/newsletter/subscribe/route.ts` to accept an optional `archetype` field and call `addSubscriberWithArchetype` when present. Update the `NewsletterSignup` component to read localStorage and include archetype in the POST body.

**D. Dashboard: show newsletter archetype status.**
In dashboard settings (`src/app/dashboard/settings/page.tsx`), show the user's newsletter archetype: "Your weekly newsletter is personalized for The Seeker." If no archetype: "Take the quiz to get personalized newsletter recommendations."

### Affected Files

- `src/app/api/newsletter/subscribe/route.ts` — accept optional archetype param
- `src/app/api/newsletter/recommendations/route.ts` — new API route
- `src/components/layout/newsletter-signup.tsx` — read localStorage archetype, send with subscribe
- `src/app/newsletter/page.tsx` — add quiz CTA for existing subscribers
- `src/lib/email.ts` — update welcome email to include quiz link
- `src/app/dashboard/settings/page.tsx` — show newsletter archetype status

### Acceptance Criteria

- [ ] Direct newsletter signups include archetype when available in localStorage
- [ ] Welcome email includes quiz CTA link
- [ ] Newsletter page prompts existing subscribers to take quiz
- [ ] `/api/newsletter/recommendations?archetype=X` returns matched events
- [ ] Dashboard settings shows newsletter personalization status
- [ ] Beehiiv subscribers are updated with archetype when it becomes available

### Dependencies

None, but value increases if Task 3 (quiz as front door) drives more quiz completions.

---

## Task 7: Navigation Restructuring

### Problem

On desktop, only Quiz and Events are top-level nav items. Experiences, Tours, Stories, Newsletter, Blog, and Membership are all hidden behind the "Explore" dropdown. This means 6 of 8 sections are invisible until the user hovers/clicks "Explore." The mobile menu shows all items, creating a different mental model between viewports.

### Current State

**Desktop header** (`src/components/layout/header.tsx`): Logo | Quiz | Events | Explore (dropdown) | Admin | Auth

**`NAV_LINKS`** (`src/lib/constants.ts`): Quiz, Events, Experiences, Humans of Ubud, Tours, Newsletter, Blog, Membership

**Explore dropdown** (`src/components/layout/explore-menu.tsx`): client component, renders all NAV_LINKS except Quiz and Events in a dropdown panel.

### Solution

**A. Promote the most important sections to top-level nav.**
Based on the app's core value proposition, the top-level desktop nav should be:

`Quiz | Events | Stories | Tours | More...`

"More..." replaces "Explore" and contains: Guides (renamed Experiences), Newsletter, Blog, Membership.

This surfaces 4 items instead of 2, covering the core user needs: personalize (Quiz), find events (Events), meet people (Stories), explore the land (Tours).

**B. Add About to the "More..." dropdown.**
Currently About is footer-only. Add it as the last item in the dropdown: Guides, Newsletter, Blog, Membership, About.

**C. Keep mobile menu unchanged.**
The mobile menu already shows all items. No changes needed — it's working well.

**D. Visual refinement of the dropdown.**
The current Explore dropdown is functional. Consider adding 1-line descriptions to each item (already exist in `NAV_LINKS` as potential additions) to help users understand what they'll find. Example: "Newsletter — Weekly dispatch" or "Guides — Understand the practices."

### Affected Files

- `src/components/layout/header.tsx` — restructure top-level nav items
- `src/components/layout/explore-menu.tsx` — update items in dropdown
- `src/lib/constants.ts` — potentially add descriptions to NAV_LINKS items

### Acceptance Criteria

- [ ] Desktop nav shows Quiz, Events, Stories, Tours at top level
- [ ] "More..." dropdown contains remaining items including About
- [ ] Mobile menu unchanged (shows all items)
- [ ] Nav items highlight correctly for active route
- [ ] Dropdown items have brief descriptions
- [ ] Responsive breakpoints work correctly (no overflow on medium screens)

### Dependencies

Should be done AFTER Task 4 (rename Experiences → Guides) to avoid doing nav work twice.

---

## Task 8: Membership Value Proposition Redesign

### Problem

The Ubudian Insider at $9.99/month offers "members-only stories & deep dives" and an "Insider badge on profile." This is a thin proposition: the badge is only visible in the dashboard (no social features where others would see it), and "members-only content" is vague. The dashboard upsell copy mentions "first access to new tours" and "tour discounts" but these aren't on the public membership page.

### Current State

**Membership page** (`src/app/membership/page.tsx`): two-tier pricing card. Free tier lists 6 benefits. Insider tier lists: "Everything in Community" + 2 additional items (members-only stories, insider badge).

**Dashboard upsell** (`src/components/dashboard/membership-upsell.tsx`): mentions additional perks not on the public page — "First access to new tours," "Member-only experiences," "Tour discounts."

**Badge rendering**: exists in dashboard overview (`src/components/dashboard/dashboard-overview.tsx`) as a gold "Insider" badge next to the archetype. Not visible anywhere else.

### Solution

**A. Align membership page perks with dashboard upsell copy.**
The perks listed on `/membership` should match what's promised in the dashboard. Add to the Insider tier card:
- First access to new tours and events
- Tour booking discounts
- Members-only stories and deep dives
- Insider badge on profile
- Support independent community media

This is a copy change in the membership page component.

**B. Add a "Support the Platform" framing.**
Many community platforms succeed with a patronage model — people pay because they want the thing to exist. Add copy to the membership page that frames Insider as both perks AND patronage: "The Ubudian is independent, community-funded, and ad-free. Insider members keep it that way."

**C. Add community testimonial or social proof.**
If there are existing Insider subscribers, show a count: "Join [N] Insiders." If not, skip this until there's data.

**D. Surface badge in more places (optional, low priority).**
If the badge is a perk, it should be visible somewhere meaningful. Options: on event submission confirmation ("Submitted by [Name] (Insider)"), on story comments if/when comments exist, on a future community directory. For now, document this as a future enhancement rather than implementing it — the badge becomes meaningful when social features exist.

### Affected Files

- `src/app/membership/page.tsx` — update perk lists, add patronage framing
- `src/components/dashboard/membership-upsell.tsx` — verify consistency with page

### Acceptance Criteria

- [ ] Membership page Insider perks match dashboard upsell copy
- [ ] Patronage framing added ("independent, community-funded, ad-free")
- [ ] Free tier benefits are clear and complete
- [ ] Pricing toggle (monthly/yearly) works correctly
- [ ] Page is responsive
- [ ] No pricing or Stripe integration changes (those are separate if/when discount logic is built)

### Dependencies

None. Fully independent. This is primarily a copy/content task.

---

## Task 9: About Page Enhancement & Visibility

### Problem

For a platform curating spiritual and wellness events, trust matters. "Who is behind this?" is a natural question. The About page exists (`/about`) but is only accessible via a small footer link — not in the main navigation, not in `NAV_LINKS`. The content is generic ("Community infrastructure for Ubud's conscious scene") and doesn't mention the quiz, experiences, or membership.

### Current State

**About page** (`src/app/about/page.tsx`): Hero + Mission (2-column) + What We Do (4 cards) + Newsletter CTA + Connect section (Instagram + email). Uses a placeholder image reference. Does NOT mention: quiz, archetypes, experiences, membership.

**Accessibility**: footer link "About & Contact" → `/about`. Not in `NAV_LINKS`, not in header, not in mobile menu.

### Solution

**A. Add About to `NAV_LINKS` (or More... dropdown).**
Per Task 7, About should be in the dropdown navigation. If Task 7 isn't done yet, at minimum add "About" to `NAV_LINKS` so it appears in the mobile menu and footer.

**B. Rewrite About page content to tell the real story.**
The About page should answer: "Why does this exist?" The answer is the WhatsApp-group problem — the fragmented information landscape of Ubud's conscious community. Frame it:

- **Problem**: "Ubud has more ecstatic dance, breathwork, and cacao ceremonies per square kilometer than anywhere on Earth. Finding them means monitoring 10+ WhatsApp groups, following 50 Instagram accounts, and talking to that friend who's been here three years."
- **Solution**: "The Ubudian puts it all in one place — curated, searchable, and personalized to you."
- **How it works**: Events aggregated from community sources + submitted by organizers → reviewed → published. Quiz matches you to your archetype. Newsletter keeps you in the loop.
- **Who**: whoever is behind it. Name, face, brief bio. "Built by [name] because [reason]."

**C. Update "What We Do" cards to reflect full product.**
Current cards: Blog, Humans of Ubud, Events, Tours. Update to include: Quiz, Events, Stories, Tours (drop Blog card, add Quiz card). Each card should have a 1-line description and link.

**D. Add a "For Event Organizers" section.**
Brief section explaining: "Run a workshop, ceremony, or class in Ubud? Submit your event for free. After 5 approved submissions, you become a trusted submitter with auto-approval." Link to `/events/submit`. This serves the organizer user segment who discovers the platform and wonders how to get listed.

### Affected Files

- `src/app/about/page.tsx` — rewrite content
- `src/lib/constants.ts` — add About to NAV_LINKS (if Task 7 not done)

### Acceptance Criteria

- [ ] About page tells the real origin story (WhatsApp-group problem → solution)
- [ ] "What We Do" cards reflect current product (Quiz, Events, Stories, Tours)
- [ ] "For Event Organizers" section explains submission + trusted submitter
- [ ] About is accessible from navigation (footer at minimum, dropdown if Task 7 done)
- [ ] Page is responsive
- [ ] No placeholder images (use real content or remove image section)

### Dependencies

Pairs with Task 7 (nav restructuring) for placement. Can be done independently.

---

## Task 10: Blog Role Clarification

### Problem

The app has three editorial content types: Blog, Stories (Humans of Ubud), and Newsletter. Their territories overlap. Blog's role is unclear — if it's not regularly updated, an empty or stale blog section undermines credibility. Stories has clear identity (community portraits). Newsletter has clear identity (weekly digest). Blog is the orphan.

### Current State

**Blog page** (`src/app/blog/page.tsx`): simple grid of published `blog_posts` ordered by `published_at desc`. Positioning: "The eat-pray-love reality, the spiritual circus, and honest takes on life in Ubud's conscious scene."

**Blog data**: `blog_posts` table has standard CMS fields (title, slug, content, cover_image_url, author_name, published_at, status, tags). Stored in Supabase.

Need to check: how many blog posts actually exist? Is content being actively published?

### Solution

This task is primarily a UX/navigation decision, not a technical change. Two approaches:

**Option A: Keep Blog, but give it clear identity.**
Rename to "Journal" or "Field Notes" and position it as long-form editorial distinct from Stories (profiles) and Newsletter (digest). Update the blog page copy to make the distinction clear: "Long reads, honest takes, and practical guides for life in Ubud." Add category/tag filtering to the blog listing page (tags exist in the schema but aren't filterable on the page).

**Option B: Demote Blog from primary navigation.**
Remove Blog from `NAV_LINKS`. Keep the pages and URLs working (don't delete content). Blog posts can still be accessed via direct links, search engines, and the newsletter (which can link to individual posts). This reduces navigation clutter without deleting anything.

**Recommended: Option A if there are 5+ published posts; Option B if fewer.**
The agent implementing this should check the actual content volume and proceed accordingly.

**For Option A, add tag filtering:**
- Read existing tags from published blog posts
- Add a tag filter row (similar to Stories theme filter)
- Filter via `?tag=` query param

**For Option B, remove from nav:**
- Remove "Blog" from `NAV_LINKS` in `src/lib/constants.ts`
- Keep all blog routes functional

### Affected Files

- `src/lib/constants.ts` — update NAV_LINKS (Option B) or rename (Option A)
- `src/app/blog/page.tsx` — add tag filtering (Option A) or no changes (Option B)

### Acceptance Criteria

**If Option A:**
- [ ] Blog renamed to "Journal" or "Field Notes" in nav
- [ ] Blog page has tag filtering
- [ ] Blog page copy clearly differentiates from Stories and Newsletter

**If Option B:**
- [ ] Blog removed from NAV_LINKS
- [ ] All blog URLs continue to work (no broken links)
- [ ] Blog posts still accessible via direct URL

### Dependencies

Should be coordinated with Task 7 (nav restructuring) and Task 4 (rename Experiences).

---

## Task Dependency Graph

```
Task 1 (Event Action Bridge)     — independent
Task 2 (Social Proof)            — independent
Task 3 (Quiz Front Door)         — independent (pairs well with Task 2)
Task 4 (Unify Events/Experiences)— independent
Task 5 (Connect Stories/Events)  — independent
Task 6 (Archetype Newsletter)    — independent (benefits from Task 3)
Task 7 (Nav Restructuring)       — should follow Task 4 (rename Experiences)
Task 8 (Membership Redesign)     — independent
Task 9 (About Page)              — pairs with Task 7
Task 10 (Blog Clarification)     — coordinate with Task 7 and Task 4
```

**Suggested execution order:**
1. Tasks 1, 2, 5, 8 — fully independent, can run in parallel
2. Tasks 3, 4, 6 — independent but shape the user experience
3. Tasks 7, 9, 10 — navigation changes, do together after Tasks 4 and 10 decisions are made

---

## Out of Scope

These were discussed in the analysis but are NOT included as tasks because they require strategic decisions beyond what an agent can implement:

- **Tour pricing visibility on cards** — requires business decision on whether to show prices before detail page
- **User reviews/ratings of events** — significant social feature with moderation implications
- **Community directory** — requires product decision on privacy and social features
- **"I'm going" / attendance intent** — requires decision on whether to build social features
- **Facilitator profiles** — a potential evolution of Task 5, but needs product design
