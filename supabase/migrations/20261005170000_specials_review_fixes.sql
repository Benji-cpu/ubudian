-- Reviewer, 5 Oct (handovers/2026-10-05-review-log.md §9): five seeded rows said
-- more than their cited source. Each is cut back to what the source supports.

-- No Más: the page gives hours and price but no days; "every day" was an inference.
UPDATE specials SET status = 'hidden', updated_at = now()
WHERE source = 'seed' AND venue_name = 'No Más';

-- Copper: the venue page says only "Bar happy hours 5 pm to 7 pm"; the 2025 flyer 404s.
UPDATE specials SET title = 'Happy hour', description = NULL, updated_at = now()
WHERE source = 'seed' AND venue_name = 'Copper Kitchen & Rooftop';

-- Lokal Bar Saturday: the deal is from Bali Buddies (updated 4 Aug 2026), not the venue site.
UPDATE specials SET source_url = 'https://balibuddies.com/best-nightlife-in-ubud/', updated_at = now()
WHERE source = 'seed' AND venue_name = 'Lokal Bar' AND title = 'Pay 2, get 3 cocktails';

-- Blue Door ladies' night: the venue page names Thursday only; details and hours came from guides.
UPDATE specials SET description = NULL, start_time = NULL, end_time = NULL, updated_at = now()
WHERE source = 'seed' AND venue_name = 'The Blue Door' AND title = 'Ladies'' night';

-- Pinstripe: undated blog, not shown to be current. Hidden until the venue confirms.
UPDATE specials SET status = 'hidden', updated_at = now()
WHERE source = 'seed' AND venue_name = 'Pinstripe';
