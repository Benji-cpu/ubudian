-- "Happy hour" reads as a drinks promo to our reader; say the hours instead.
update specials set description = 'Treatments of an hour or more. Book ahead and mention the 10:00–14:00 offer.', updated_at = now()
where venue_name = 'AUM Spa' and status = 'live' and title like '25%%';
