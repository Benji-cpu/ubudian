-- Ubud deals, batch 2 (5 Oct 2026): 21 more venues, each from a public source
-- read on 5 Oct. Research and per-row evidence: docs/tonight/deals-batch2-2026-10.md.
--
-- Rules (Reviewer, review log §9): a row says only what its source says. Where a
-- source gives hours but no days, weekdays is empty AND days_stated is false, so
-- the page says "days not stated" instead of "every day". "++" (tax and service)
-- goes in the description. Nobody was contacted, and no contact_email is set:
-- the nightly reconfirm mails any row that has one, and no venue gets mail
-- without Ben's yes. Every row lapses on its own after 30 days.
--
-- Needs 20261005200000_specials_days_stated.sql first.

INSERT INTO specials (venue_name, venue_area, venue_address, instagram_handle, website_url, title, description, price_idr, weekdays, days_stated, start_time, end_time, source, source_url) VALUES
  -- Venue's own page, read 5 Oct 2026
  ('Kemangi', 'Penestanan', 'Jl. Penestanan Kelod, Sayan', 'kemangiubudresto', 'https://kemangiubudresto.com/', '2+1 cocktails', 'Order two cocktails, get a third free.', NULL, '{}'::smallint[], false, '16:00', '18:00', 'seed', 'https://kemangiubudresto.com/special-offers/'),
  ('Kemangi', 'Penestanan', 'Jl. Penestanan Kelod, Sayan', 'kemangiubudresto', 'https://kemangiubudresto.com/', 'Beer bucket with chicken satay', 'Three Singaraja for IDR 100k++ or three Bintang for IDR 150k++, with chicken satay.', NULL, '{}'::smallint[], false, NULL, NULL, 'seed', 'https://kemangiubudresto.com/special-offers/'),
  ('Kraton by K Club', 'Tegallalang', 'Jl. Raya Cebok, Kedisan', 'kclububud', 'https://www.kclububud.com/kraton', 'All you can eat', 'Two hours of unlimited dining, per person.', 399000, ARRAY[1,4]::smallint[], true, '11:00', '20:00', 'seed', 'https://www.kclububud.com/kraton'),
  ('Kakiang Bakery & Cafe', 'Pengosekan', 'Jl. Raya Pengosekan', NULL, 'https://kakiangbakery.com/kakiang-bakery-cafe/', 'Breakfast set with free coffee', 'Croissant, sandwich or fried rice set, with free coffee or Java tea (free upgrade to latte or cappuccino).', 55000, '{}'::smallint[], false, '07:00', '10:00', 'seed', 'https://kakiangbakery.com/kakiang-bakery-cafe/'),
  ('Kakiang Bakery & Cafe', 'Pengosekan', 'Jl. Raya Pengosekan', NULL, 'https://kakiangbakery.com/kakiang-bakery-cafe/', 'Four small Singaraja beers', NULL, 120000, '{}'::smallint[], false, NULL, NULL, 'seed', 'https://kakiangbakery.com/kakiang-bakery-cafe/'),
  ('Habitat Bistro', 'Ubud town', 'Jl. Bisma 888A', 'habitatbistroubud', NULL, 'Buy 1, get 1 cocktails with a canapé', 'IDR 175k++ for two cocktails and a canapé. Not with other offers.', 175000, '{}'::smallint[], false, '17:00', '19:00', 'seed', 'https://thewonderspace.com/habitatbistroubud/promo'),
  ('Habitat Bistro', 'Ubud town', 'Jl. Bisma 888A', 'habitatbistroubud', NULL, 'Breakfast set', 'Every morning. Add a floating breakfast for IDR 100k.', 200000, '{}'::smallint[], true, '06:30', '11:00', 'seed', 'https://thewonderspace.com/habitatbistroubud/promo'),
  ('Norii', 'Ubud town', 'Jl. Sawah Indah, Gg. Amarea 8', 'noriibali', NULL, 'Any appetizer for IDR 80k', 'Anything from the appetizer menu, plus tax and service.', 80000, '{}'::smallint[], false, '12:00', '17:00', 'seed', 'https://thewonderspace.com/noriiubud/promo'),
  ('Honey & Smoke', 'Ubud town', 'Jl. Monkey Forest 67B', 'honeyandsmoke.co', 'https://honeyandsmoke.co/', 'Early bird: five dishes from the fire', 'Chosen by the kitchen, made to share. Per person, plus tax and service.', 400000, '{}'::smallint[], true, '17:30', '19:00', 'seed', 'https://honeyandsmoke.co/'),
  ('CasCades (Viceroy Bali)', 'Petulu', 'Viceroy Bali, Jl. Lanyahan', NULL, 'https://www.cascadesbali.com/', 'Afternoon tea: under-6s free, 6–11 half price', 'IDR 450k++ per adult. Book at least a day ahead.', 450000, '{}'::smallint[], true, '14:00', '16:00', 'seed', 'https://www.cascadesbali.com/events/elegant-afternoon-tea/'),
  ('Kepitu (The Kayon Resort)', 'Tegallalang', 'Banjar Kepitu, Kendran', 'thekayonresort', 'https://thekayonresort.com/', 'Ladies'' night: free welcome cocktail', 'With an à la carte dinner, for ladies. Booking only.', NULL, ARRAY[3]::smallint[], true, '19:00', '22:00', 'seed', 'https://thekayonresort.com/mood-ladies-night/'),
  ('Wapa di Ume', 'Ubud town', 'Jl. Suweta, Bentuyung', 'wapadiumeubud', 'https://wapadiumeubud.com/', 'BBQ dinner and Barong dance: kids half price', 'Adults IDR 488k++, under-12s IDR 244k++. Welcome drink, BBQ buffet and dance. Booking required.', 488000, ARRAY[1,4]::smallint[], true, '18:30', '22:00', 'seed', 'https://wapadiumeubud.com/dining/bbq-culture-dinner-ubud/'),

  -- Booking platform listing, live 5 Oct 2026
  ('Melali', 'Ubud town', 'Jl. Sri Wedari 58', 'melali.ubud', NULL, 'Buy 2 glasses of wine, get 1 free', 'Selected wines, IDR 55k++ a glass. Not with other offers.', 55000, ARRAY[1,2,3,4,5]::smallint[], true, '15:00', '18:00', 'seed', 'https://www.chope.co/bali-restaurants/restaurant/melali-ubud'),
  ('Melali', 'Ubud town', 'Jl. Sri Wedari 58', 'melali.ubud', NULL, 'Sundowner: cocktail and bites', 'Plus tax and service.', 85000, '{}'::smallint[], true, '18:00', '20:00', 'seed', 'https://www.chope.co/bali-restaurants/restaurant/melali-ubud'),
  ('Melali', 'Ubud town', 'Jl. Sri Wedari 58', 'melali.ubud', NULL, 'GINtastic Thursday', 'Gin cocktails and tapas, plus tax and service.', 75000, ARRAY[4]::smallint[], true, NULL, NULL, 'seed', 'https://www.chope.co/bali-restaurants/restaurant/melali-ubud'),
  ('Melali', 'Ubud town', 'Jl. Sri Wedari 58', 'melali.ubud', NULL, 'Breakfast board: pick five', 'Five items, plus tax and service.', 98000, '{}'::smallint[], true, '07:00', '11:30', 'seed', 'https://www.chope.co/bali-restaurants/restaurant/melali-ubud'),
  ('Sayan Valley', 'Sayan', 'Jl. Raya Sayan 77', NULL, 'https://sayanvalley.com/', 'Second drink free', 'Happy hour: your second drink is on them.', NULL, '{}'::smallint[], false, '12:00', '17:00', 'seed', 'https://www.chope.co/bali-restaurants/restaurant/sayan-valley-sunset-bar-ubud?lang=en_US'),

  -- Dated guides and reviews (2026)
  ('Toro Dining', 'Ubud town', 'Jl. Gootama 3', NULL, NULL, 'Buy 2 beers, get 1 free', 'Daily, with sushi promos at the same time (Finn''s guide, 25 Jun 2026).', NULL, '{}'::smallint[], true, '16:00', '19:00', 'seed', 'https://finnsbeachclub.com/guides/bali-best-happy-hour/'),
  ('Kafe Batan Waru', 'Ubud town', 'Jl. Dewi Sita', NULL, NULL, '2-for-1 lychee martinis', 'Daily happy hour (Finn''s guide, 25 Jun 2026).', NULL, '{}'::smallint[], true, '16:00', '19:00', 'seed', 'https://finnsbeachclub.com/guides/bali-best-happy-hour/'),
  ('Beer Brothers', 'Ubud town', 'Jl. Bisma 16', NULL, NULL, 'Two beers for the price of one', 'Happy hour (Finn''s guide, 24 Aug 2026).', NULL, '{}'::smallint[], false, NULL, NULL, 'seed', 'https://finnsbeachclub.com/guides/best-bars-cocktails-nightlife-ubud/'),
  ('Why Not', 'Ubud town', 'Jl. Bisma 8', 'whynotubud', NULL, '2-for-1 happy hour', 'Live rock and blues on Fridays (Finn''s guide, 24 Aug 2026).', NULL, '{}'::smallint[], false, NULL, NULL, 'seed', 'https://finnsbeachclub.com/guides/best-bars-cocktails-nightlife-ubud/'),
  ('Laughing Buddha Bar', 'Ubud town', 'Jl. Monkey Forest', NULL, NULL, '2-for-1 classic cocktails', 'Happy hour (Finn''s guide).', NULL, '{}'::smallint[], false, '16:00', '20:00', 'seed', 'https://finnsbeachclub.com/guides/best-happy-hours-ubud/'),
  ('CP Lounge', 'Ubud town', 'Jl. Monkey Forest 15', NULL, 'https://www.cp-lounge.com/', 'Buy 2 cocktails, get the 3rd free', 'Happy hour (Finn''s guide).', NULL, '{}'::smallint[], false, '13:00', '20:00', 'seed', 'https://finnsbeachclub.com/guides/best-happy-hours-ubud/'),
  ('Oops Restaurant & Bar', 'Ubud town', 'Jl. Dewisita', NULL, NULL, '2-for-1 mojitos', 'Evening happy hour; times vary (Finn''s guide).', NULL, '{}'::smallint[], false, NULL, NULL, 'seed', 'https://finnsbeachclub.com/guides/best-happy-hours-ubud/'),
  ('Sawobali', 'Peliatan', 'Jl. Sukma Kesuma 19', NULL, NULL, 'All-you-can-eat vegan buffet', 'One hour, IDR 75k a person (HappyCow reviews, Jun–Sep 2026).', 75000, '{}'::smallint[], false, NULL, NULL, 'seed', 'https://www.happycow.net/reviews/sawobali-ubud-81975'),
  ('Uma Cucina (COMO Uma Ubud)', 'Sanggingan', 'Jl. Raya Sanggingan 21', NULL, 'https://www.comohotels.com/bali/como-uma-ubud/dining/uma-cucina', 'Sunday brunch, all you can eat', 'IDR 400k++ a person; beer and cocktail add-ons (Honeycombers, 5 Jan 2026).', 400000, ARRAY[0]::smallint[], true, '11:30', '15:30', 'seed', 'https://thehoneycombers.com/bali/brunch-restaurants-bali-buffet/');

-- No Más: hidden by the Reviewer (§9) because its page gives hours and price but
-- no days. Now that a row can say "days not stated", it goes back up as exactly
-- that, re-checked 5 Oct against its own 2026 happy-hour menu.
UPDATE specials
SET status = 'live', days_stated = false, weekdays = '{}'::smallint[],
    title = 'Happy hour: five cocktails', description = 'Five house cocktails at IDR 95k each, plus tax.',
    confirmed_at = now(), expires_on = (now() AT TIME ZONE 'Asia/Makassar')::date + 30, updated_at = now()
WHERE source = 'seed' AND venue_name = 'No Más';
