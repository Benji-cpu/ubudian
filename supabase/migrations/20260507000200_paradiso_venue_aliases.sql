-- Seed venue_aliases so Paradiso events from Megatix, Instagram (Apify),
-- and any free-form WhatsApp/Telegram forwards collapse to the same canonical
-- venue. The Megatix listings for Paradiso usually print "Paradiso Ubud" but
-- the IG poster crops it to "Paradiso" or just "@paradisoubud".

INSERT INTO venue_aliases (canonical_name, alias) VALUES
  ('Paradiso Ubud', 'Paradiso'),
  ('Paradiso Ubud', 'Paradiso Ubud'),
  ('Paradiso Ubud', 'paradisoubud'),
  ('Paradiso Ubud', '@paradisoubud'),
  ('Paradiso Ubud', 'Paradiso Bali'),
  ('Paradiso Ubud', 'Paradiso Vegan')
ON CONFLICT (alias) DO NOTHING;
