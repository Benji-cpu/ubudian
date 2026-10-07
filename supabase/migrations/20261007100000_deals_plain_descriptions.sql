-- Readers don't need our working-out (Ben, 7 Oct: no "where do I get this info" on cards).
-- One plain "normally" line instead of the itemised sum. Expected: 3 rows updated.
UPDATE specials SET description = 'A breakfast dish, a coffee and a pressed juice. Normally about IDR 185k. Dine-in, plus tax and service.', updated_at = now()
WHERE status = 'live' AND venue_name = 'Milk & Madu' AND title = 'Breakfast, coffee and juice for IDR 110k';
UPDATE specials SET description = 'Normally IDR 95–125k. Plus tax and service.', updated_at = now()
WHERE status = 'live' AND venue_name = 'Milk & Madu' AND title = 'Pasta Club: pasta for IDR 65k';
UPDATE specials SET description = 'Normally IDR 140k. Plus tax and service.', updated_at = now()
WHERE status = 'live' AND venue_name = 'Milk & Madu' AND title = 'Parma Night: chicken parma for IDR 95k';
