-- Fix Sunday Ecstatic Dance time at The Yoga Barn.
-- The original seed migration (20260424111300) inserted 07:00-09:00, but the
-- actual session runs 11:30-13:30. Update the seeded core event in place.

UPDATE events
SET start_time = '11:30',
    end_time   = '13:30',
    updated_at = NOW()
WHERE slug = 'core-yogabarn-ecstatic-dance-sunday';
