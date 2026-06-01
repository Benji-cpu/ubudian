-- Link-health deep-dive, part 2 — 2026-06-01

-- Momentum Contact Improvisation Fundamentals (Ubud): real and upcoming, but
-- mis-dated. The live registration page (msha.ke/momentumworkshop) lists the
-- Ubud edition as June 6-7-8, 2026 — our row said Jun 13-14. Correct the dates
-- so users don't arrive a week late. (Uluwatu Jun 20-21 is a separate, non-Ubud
-- edition we intentionally don't carry.)
UPDATE events
SET start_date = '2026-06-06', end_date = '2026-06-08', updated_at = now()
WHERE id = '61968735-9f11-40fc-98c2-e53427264b6d' AND status = 'approved';

-- New Moon Kirtan & Sacred Tea (Jun 25): non-recurring, its only provenance is a
-- 2022 Megatix page (`new-moon-kirtan-sacred-tea`, JSON-LD 2022-04-29, "already
-- taken place"), and Jun 25 isn't the June-2026 new moon (~Jun 15). No current
-- confirmation of a real Jun 25 edition. Archive as a mis-dated/stale phantom;
-- the curator re-ingests if a genuine edition surfaces.
UPDATE events
SET status = 'archived',
    moderation_reason = 'stale_megatix_phantom_2026-06-01',
    updated_at = now()
WHERE id = '4c495d1b-b5f9-436b-bce4-a47d22590cf6' AND status = 'approved';
