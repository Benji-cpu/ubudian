-- Venue research, 6 Oct 2026 (handovers/2026-10-05-ubudian-deals.md): two rows corrected.
-- Everything else checked came back confirmed on the venues' own pages.

-- Toro Dining: Finn's guide, updated 5 Oct 2026, now reads "buy two get one free on the
-- cocktails … 1 p.m. to 7 p.m daily", not beers 4–7 (its 25 Jun 2026 version). Newest
-- dated source wins; no venue-owned page shows the deal either way.
UPDATE specials
SET title = 'Buy 2 cocktails, get 1 free',
    description = 'Daily, with sushi promos at the same time (Finn''s guide, 5 Oct 2026).',
    start_time = '13:00', end_time = '19:00',
    source_url = 'https://finnsbeachclub.com/guides/bali-best-happy-hour/',
    confirmed_at = now(), expires_on = (now() AT TIME ZONE 'Asia/Makassar')::date + 30, updated_at = now()
WHERE source = 'seed' AND venue_name = 'Toro Dining';

-- Oops: the street ("Jl. Dewisita") is unverified and may be wrong, so drop it; Directions then
-- searches the venue's name and area instead of pinning a possibly wrong street.
UPDATE specials SET venue_address = NULL, updated_at = now()
WHERE source = 'seed' AND venue_name = 'Oops Restaurant & Bar';
