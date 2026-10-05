-- Ubud deals, wellness and food batch (6 Oct 2026), under the food-and-wellness
-- rule (CLAUDE.md "What we list"). Each row says only what its source says; every
-- source page was read on 6 Oct. Research: Code/handovers/ubudian-deals-tools/
-- deals-research-wellness-2026-10-06.json. No contact_email, so nobody is mailed.

INSERT INTO specials (venue_name, venue_area, website_url, title, description, price_idr, weekdays, days_stated, start_time, end_time, source, source_url) VALUES
  ('AUM Spa', 'Ubud town', 'https://aumspaubud.com/', '25% off spa treatments, late morning', 'Book ahead and mention the happy-hour offer.', NULL, '{}'::smallint[], false, '10:00', '14:00', 'seed', 'https://aumspaubud.com/promo/special-offer-happy-hours/'),
  ('Sang Spa', 'Ubud town', 'https://sangspa.com/', '10% off treatments of 2 hours or more', 'Daily morning offer.', NULL, '{}'::smallint[], true, '09:00', '15:00', 'seed', 'https://sangspa.com/'),
  ('Jaens Spa', 'Ubud town', 'https://jaensspa.com/', '15% off spa treatments in the morning', 'At the Center, Triloka and Shanti branches (Bisma: 10:00–14:00). Not on spa packages.', NULL, '{}'::smallint[], false, '09:00', '13:00', 'seed', 'https://jaensspa.com/best-deal/'),
  ('Heart Space', 'Nyuh Kuning', 'https://www.heartspacebali.com/', 'Dinner after evening yoga, IDR 200k', 'Vegetarian main, dessert and a juice at Flourish after an evening class, tax and service included. Class booked separately.', 200000, '{}'::smallint[], false, NULL, NULL, 'seed', 'https://www.heartspacebali.com/deals'),
  ('Suka Espresso', 'Pengosekan', 'https://bysuka.com/suka-ubud', 'Breakfast favourites, IDR 60k', 'Every morning until 3pm.', 60000, '{}'::smallint[], true, NULL, '15:00', 'seed', 'https://bysuka.com/suka-ubud');

-- A dated offer: runs through October only.
INSERT INTO specials (venue_name, venue_area, website_url, title, description, price_idr, weekdays, days_stated, start_time, end_time, source, source_url, expires_on) VALUES
  ('AUM Spa', 'Ubud town', 'https://aumspaubud.com/', '15% off a 90-minute warm stone massage', 'Through October.', NULL, '{}'::smallint[], true, NULL, NULL, 'seed', 'https://aumspaubud.com/promo/warm-stones-deeper-relaxation/', '2026-10-31');
