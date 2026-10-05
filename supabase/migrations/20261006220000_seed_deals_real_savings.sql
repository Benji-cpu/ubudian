-- Deals that pass the 25% test (CLAUDE.md "What we list"), each checked by hand on
-- 6 Oct against the venue's own menu. Milk & Madu: menu PDF uploaded Aug 2026
-- (https://milkandmadu.com/wp-content/uploads/2026/08/MilkMadu-Menu.pdf), the group
-- menu used by its Ubud venue. Kaveri: the resort's own offer page, valid for 2026.
-- Research: Code/handovers/ubudian-deals-tools/deals-research-savings-2026-10-06.json

INSERT INTO specials (venue_name, venue_area, instagram_handle, website_url, title, description, price_idr, normal_price_idr, weekdays, days_stated, start_time, end_time, source, source_url) VALUES
  ('Milk & Madu', 'Ubud town', 'milkandmadu', 'https://milkandmadu.com/', 'Breakfast, coffee and juice for IDR 110k', 'A breakfast dish, a coffee and a pressed juice. Ordered separately that''s about IDR 185k (oats 85k, latte 40k, juice 60k). Dine-in, plus tax and service.', 110000, 185000, ARRAY[1,2,3,4,5]::smallint[], true, '07:00', '11:00', 'seed', 'https://milkandmadu.com/menu/brekky-set/'),
  ('Milk & Madu', 'Ubud town', 'milkandmadu', 'https://milkandmadu.com/', 'Pasta Club: pasta for IDR 65k', 'Pastas are normally IDR 95–125k on their menu. Plus tax and service.', 65000, 120000, ARRAY[5]::smallint[], true, '17:00', NULL, 'seed', 'https://milkandmadu.com/menu/pasta-club/'),
  ('Milk & Madu', 'Ubud town', 'milkandmadu', 'https://milkandmadu.com/', 'Parma Night: chicken parma for IDR 95k', 'Normally IDR 140k on their menu. Plus tax and service.', 95000, 140000, ARRAY[3]::smallint[], true, '17:00', NULL, 'seed', 'https://milkandmadu.com/menu/parma-night/'),
  ('Kaveri Spa (The Udaya)', 'Ubud town', 'kaverispa', 'https://kaverispa.theudayaresort.com/', '30% off all spa treatments booked online', 'Book on their website with code KAV30; paid in full in advance, non-refundable.', NULL, NULL, '{}'::smallint[], true, NULL, NULL, 'seed', 'https://theudayaresort.com/package.php?name=KAV30');

-- Their menu gives the pizza night as 4–10pm.
update specials set end_time = '22:00', updated_at = now()
where venue_name = 'Milk & Madu' and title = '2-for-1 pizza night' and status = 'live';
