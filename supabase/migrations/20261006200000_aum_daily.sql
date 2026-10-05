-- AUM Spa's promo page says "Available daily from 10:00 AM to 2:00 PM" (read 6 Oct).
-- Kakiang's menu gives hours (07:00–10:00) but no days, so it stays "days not stated".
update specials set weekdays = '{}'::smallint[], days_stated = true, updated_at = now()
where venue_name = 'AUM Spa' and status = 'live' and title like '25%%';
