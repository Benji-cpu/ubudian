-- Expand Megatix search terms and add known venue shortcuts
-- Fixes coverage gap: venues like Yoga Barn, Sayuri whose names don't contain "ubud"
UPDATE event_sources
SET config = '{
  "_preParsed": true,
  "search_terms": ["ubud", "yoga barn", "sayuri", "ecstatic dance", "breathwork", "sound healing"],
  "ubud_localities": ["Ubud", "Gianyar", "Peliatan", "Mas", "Sayan", "Campuhan", "Penestanan", "Nyuh Kuning", "Keliki", "Lodtunduh", "Tegallalang", "Kedewatan", "Singakerta"],
  "known_ubud_venues": ["The Yoga Barn", "Yoga Barn", "Sayuri", "Askara Sound Temple", "Paradiso Ubud"],
  "fetch_delay_ms": 500,
  "max_events_per_run": 15,
  "max_list_pages": 20
}'::jsonb
WHERE slug = 'megatix';
