-- The Blue Door's roast price is a "from" price: keep "from" next to the number
-- (room, 6 Oct). price_idr goes NULL so no bare "IDR 190k" chip shows.
update specials set price_idr = null,
  description = 'Beef or chicken roast, from IDR 190k.',
  updated_at = now()
where venue_name = 'The Blue Door' and title = 'Sunday roast';
