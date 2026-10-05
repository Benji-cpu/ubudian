-- A deal is a real saving (Ben, 6 Oct 2026): 25% or more below the venue's own
-- normal price, named in one line from the offer's terms or a published menu
-- price. Menu prices called "specials", "from" prices, 10–15% off and venue-only
-- "save X%" claims come off. Rows are hidden, never deleted; the note shows to
-- the venue on /venue. Doc: Code/handovers/2026-10-06-what-is-a-deal.md
-- Expected: 12 rows hidden, 1 retitled; 3 stay live.
update specials set status = 'hidden',
  review_note = 'Not listed: we list deals that are at least 25% below your normal price. Add your normal price and we''ll look again.',
  updated_at = now()
where status = 'live' and (
  (venue_name = 'The Blue Door' and title = 'Sunday roast') or
  (venue_name = 'Heart Space') or
  (venue_name = 'Habitat Bistro') or
  (venue_name = 'Indus' and title = 'Two-course valley lunch') or
  (venue_name = 'Melali' and title = 'Breakfast board: pick five') or
  (venue_name = 'Folk Pool & Gardens' and title = 'Sunday cookout') or
  (venue_name = 'Suka Espresso') or
  (venue_name = 'Norii') or
  (venue_name = 'Sawobali') or
  (venue_name = 'AUM Spa' and title like '15%%') or
  (venue_name = 'Sang Spa') or
  (venue_name = 'Jaens Spa')
);

-- State the saving in the title: their menu prices a coffee at 32k.
update specials set title = 'Breakfast set with a free coffee (worth 32k)',
  updated_at = now()
where venue_name = 'Kakiang Bakery & Cafe' and title = 'Breakfast set with free coffee';
