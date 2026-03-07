# The Ubudian — Testing Guide

A click-by-click walkthrough of every page and feature. Start from the homepage and work through each section in order.

---

## Before You Start

1. Make sure the dev server is running (`npm run dev` in your terminal)
2. Open the site in your browser at **localhost:4000**
3. Run the seed SQL in the Supabase SQL Editor (Dashboard > SQL Editor > paste contents of `supabase/seed.sql` > Run)
4. Make sure `http://localhost:4000/auth/callback` is listed in your Supabase dashboard under Authentication > URL Configuration > Redirect URLs

---

## 1. Homepage

**What to check:**

- The page loads without errors
- Scroll down through each section:
  - **Hero section** at the top with a headline and call-to-action
  - **Stories section** — should show story cards with names, photos, and taglines (Wayan Sukerta, Sarah Chen, etc.)
  - **Events section** — should show upcoming event cards with dates, venues, and categories
  - **Tours section** — should show tour cards with photos, durations, and prices
  - **Newsletter signup** — enter a test email and submit. You should see a success message.
- All images should load (they come from Unsplash)
- The page should not have any empty sections

---

## 2. Navigation

**Desktop (wide screen):**

- The top navigation bar should show: **Quiz**, **Events**, **Humans of Ubud**, **Tours**, **Newsletter**, **Blog**
- Click each link and verify it goes to the correct page
- The "Quiz" link should go to the quiz page (not a generic "Discover" page)
- If you are logged in as admin, you should also see an **Admin** link

**Mobile (narrow screen or phone):**

- Resize your browser window to be narrow (or use phone view in dev tools)
- A hamburger menu icon should appear
- Tap it — the same links should appear in the mobile menu
- Each link should work and close the menu

---

## 3. Events Page

**List view (default):**

- Navigate to the Events page
- You should see event cards showing: date, title, venue, category badge, time, and price
- Each card should be clickable
- Recurring events should show a recurrence indicator

**Category filters:**

- Click different category buttons (Yoga & Wellness, Community & Social, etc.)
- The event list should filter to show only matching events
- Click "All" or clear the filter to show everything again

**Search:**

- If there is a search bar, type a keyword like "yoga" or "jazz"
- Results should filter in real time

**Calendar/Week views:**

- If view toggle buttons exist (List / Week / Calendar), click each one
- Week view should show events organized by day
- Calendar view should show a monthly grid with events on their dates

**Event detail page:**

- Click on any event card (e.g., "Full Moon Sound Healing Ceremony")
- The detail page should show:
  - Cover image
  - Title, date, and time
  - Venue name, address, and "View on Maps" link
  - Price information
  - Full description with formatted text (headings, bullet points)
  - Organizer name and contact
  - Related events at the bottom

---

## 4. Stories Page (Humans of Ubud)

**Story list:**

- Navigate to "Humans of Ubud" from the nav bar
- You should see 5 story cards in a grid
- Each card shows a portrait photo, the person's name, tagline, and theme tags
- Cards should be portrait-oriented but not excessively tall

**Theme tag filters:**

- Click on theme tags (Artist, Healer, Farmer, etc.) if filter buttons exist
- The grid should filter to matching stories

**Story detail page:**

- Click on a story card (e.g., "Wayan Sukerta")
- The detail page should show:
  - Photo gallery (multiple photos)
  - Subject name and tagline
  - Theme tag badges
  - Full narrative text (long-form story, multiple paragraphs)
  - The text should be well-formatted and readable

---

## 5. Tours Page

**Tour list:**

- Navigate to Tours from the nav bar
- You should see 5 tour cards with photos, titles, durations, prices, and theme badges
- Prices should display in IDR format (e.g., "IDR 850,000")

**Tour detail page:**

- Click on a tour card (e.g., "Sacred Water Temples & Rice Terraces")
- The detail page should show:
  - Photo gallery (multiple photos in a grid)
  - Title, theme badge, duration, price, and group size
  - Short description
  - Full description
  - Detailed itinerary with times
  - "What's Included" list
  - "What to Bring" list
  - Guide name
  - **WhatsApp booking button** — click it and verify it opens WhatsApp (or prompts to open WhatsApp) with a pre-filled message
  - Related tours at the bottom

---

## 6. Newsletter Page

**Newsletter list:**

- Navigate to Newsletter from the nav bar
- You should see 2 newsletter edition cards
- Each should show the subject line, preview text, and date

**Newsletter detail page:**

- Click on a newsletter edition (e.g., "The Mask Carver's Secret")
- The detail page should show these sections:
  - **Featured story excerpt** with a "Read the full story" link
  - **What's Happening This Week** with event listings
  - **Community Bulletin** with announcements
  - **Cultural Moment** with a cultural explainer (e.g., Canang Sari)
  - **Weekly Question** and community responses
  - **Tour Spotlight** with a link to a tour

- Check that internal links work (story links, tour links)
- If previous/next navigation exists, test it between the two editions

---

## 7. Quiz

- Navigate to Quiz from the nav bar
- Complete the full quiz by answering all questions
- On the results page, verify:
  - Your primary archetype is displayed
  - Personalized recommendations appear (events, stories, tours that match your type)
  - The results page looks complete and well-formatted

---

## 8. Admin Dashboard

**Logging in:**

- Click the login link (or navigate to the login page)
- Sign in with the admin email (profbenjo@gmail.com) via Google or magic link
- After login, you should be redirected back to the site
- An **Admin** link should now appear in the navigation bar
- If the Admin link does not appear, see the Troubleshooting section below

**Admin sections to test:**

Click into the Admin area and check each section:

1. **Dashboard** — Overview stats should show counts of events, stories, tours, subscribers
2. **Events** — Should list all 10 seeded events. Try:
   - Click an event to view/edit it
   - Change a field and save
   - Check that status filters work (approved, pending, etc.)
3. **Stories** — Should list all 5 seeded stories. Try:
   - Click a story to view/edit it
   - Verify the form loads with all fields populated
4. **Blog** — May be empty (no blog posts were seeded). Try creating a new post if desired.
5. **Newsletter** — Should list the 2 seeded editions. Try:
   - Click an edition to view/edit it
   - Verify all content sections are populated in the form
6. **Tours** — Should list all 5 seeded tours. Try:
   - Click a tour to view/edit it
   - Toggle the "active" status
7. **Subscribers** — May be empty or show test subscribers
8. **Trusted Submitters** — Should show 2 entries:
   - sarah@ubudorganic.co (5 approvals, auto-approve ON)
   - events@alchemybali.com (3 approvals, auto-approve OFF)

---

## 9. Event Submission (Public)

- Open a new incognito/private browser window (so you are not logged in as admin)
- Navigate to the Events page
- Look for a "Submit an Event" button or link
- Fill out the event submission form with test data:
  - Title: "Test Community Potluck"
  - Category: Community & Social
  - Date: any future date
  - Fill in remaining required fields
- Submit the form
- You should see a success message saying the event is pending review

**Approve the submitted event:**

- Switch back to your admin browser window
- Go to Admin > Events
- Filter by "Pending" status
- You should see the "Test Community Potluck" event
- Approve it
- Go to the public Events page and verify it now appears in the list

---

## 10. Troubleshooting

**Admin link does not appear after login:**

- Sign out completely, then sign back in
- If it still doesn't appear, open the Supabase dashboard, go to SQL Editor, and run:
  ```
  UPDATE profiles SET role = 'admin' WHERE email = 'profbenjo@gmail.com';
  ```
- Then sign out and sign back in again
- Make sure `http://localhost:4000/auth/callback` is in your Supabase Redirect URLs

**Pages are empty (no events, stories, or tours):**

- Make sure you ran the `supabase/seed.sql` script in the Supabase SQL Editor
- Check the Supabase Table Editor to verify data exists in the tables
- Check that events have `status = 'approved'`, stories have `status = 'published'`, and tours have `is_active = true`

**Images don't load:**

- The seed data uses Unsplash URLs which require an internet connection
- Check your browser console for blocked requests
- Some ad blockers may interfere with external image loading

**Login redirect fails:**

- Verify that `http://localhost:4000/auth/callback` is in your Supabase dashboard under Authentication > URL Configuration > Redirect URLs
- Check that `.env.local` has `NEXT_PUBLIC_SITE_URL=http://localhost:4000`

**Build errors after changes:**

- Run `npm run build` to check for TypeScript errors
- Run `npm run lint` to check for linting issues
- If you see errors about missing environment variables, make sure `.env.local` is complete
