-- Kakiang's breakfast set (IDR 55k) comes with a coffee their menu prices at 32k,
-- so the same breakfast normally costs 87k. Milk & Madu (2-for-1) and AUM (25% off)
-- state their saving in their own terms, so they need no normal price.
update specials set normal_price_idr = 87000, updated_at = now()
where venue_name = 'Kakiang Bakery & Cafe' and status = 'live' and title like 'Breakfast set with a free coffee%';
