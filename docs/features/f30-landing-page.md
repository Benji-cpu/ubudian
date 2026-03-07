# F30: Landing Page (Full)

**Phase:** 7 — Landing Page
**Depends on:** F09, F12, F23, F28
**Blocks:** None

---

## What

The full landing page, pulling together content from all sections of the site. Built last because it depends on stories, events, tours, and newsletter all being functional.

## Pages

- `src/app/page.tsx` — Landing page

## Spec

### Sections (top to bottom)

1. **Hero**
   - Large hero image (Ubud landscape or community photo)
   - Headline: "Your Insider Guide to Ubud" (or similar — to be refined)
   - Subtitle: brief value prop
   - Newsletter signup form (prominent)

2. **Upcoming Events Preview**
   - Section title: "What's Happening in Ubud"
   - 3-4 event cards (next upcoming published events)
   - "View All Events →" link to `/events`

3. **Humans of Ubud Teaser**
   - Section title: "Humans of Ubud"
   - Latest story: large photo + name + excerpt
   - 2 more story cards beside it
   - "Read More Stories →" link to `/humans-of-ubud`

4. **What is The Ubudian?**
   - Brief value prop paragraph (2-3 sentences)
   - Three pillars: Stories | Events | Tours (with icons)
   - "Learn More →" link to `/about`

5. **Secret Tours Preview**
   - Section title: "The Ubudian Secret Tours"
   - Brief narrative: "Not a tour — an insider day with a local friend"
   - 2-3 tour cards
   - "Explore Tours →" link to `/tours`

6. **Latest Newsletter**
   - Teaser of most recent edition (subject + preview text)
   - "Read the latest edition →" link
   - Newsletter signup form (again — capture those who scrolled)

7. **Footer** (from F02 layout)

### Data Loading
- Server component: fetch latest published events, stories, tours, newsletter edition from Supabase
- Static sections (value prop, etc.) are hardcoded

### Design
- Generous spacing between sections
- Alternating background colors (cream / white) for visual rhythm
- Photography-forward (hero image, story photos)
- Mobile: sections stack vertically, full-width images

## Verification

- All sections render with real data
- Event cards link to correct event pages
- Story cards link to correct story pages
- Tour cards link to correct tour pages
- Newsletter signup works
- Responsive on all breakpoints
- Page loads fast (no layout shift)
