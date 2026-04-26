-- Systemic fixes to clean up the data surface for the agenda feed.
--
-- 1) Backfill quality_score on hand-seeded is_core anchors so they aren't
--    penalised by the 0.5 default in ranking.
-- 2) Archive the duplicate "Embodied Tantra Level 1 Weekend Workshop" row
--    (no quality_score, no venue) — keeper is the row with quality_score=0.8.
-- 3) Normalise recurrence_rule formats: parseRecurrenceRule expects JSON
--    ({"frequency":"weekly"}) but the table holds RRULE strings, natural
--    language, and free-text. Translate everything we can; clear what we can't.

-- 1. Backfill quality_score on Core anchors --------------------------------
UPDATE events
SET quality_score = 0.85
WHERE is_core = true AND quality_score IS NULL;

-- 2. Archive the Embodied Tantra Level 1 duplicate -------------------------
-- Keeper: 8c180033-40bd-4256-a1e1-4768e68b668c (quality_score=0.8)
-- Archive: fd3b430d-bf90-4545-b892-b0583fa42587 ("...Weekend Workshop", quality_score=null)
UPDATE events
SET status = 'archived',
    rejection_reason = 'duplicate of 8c180033-40bd-4256-a1e1-4768e68b668c (Layer 3 dedup miss)'
WHERE id = 'fd3b430d-bf90-4545-b892-b0583fa42587' AND status != 'archived';

-- Also archive the duplicate "Embodied Tantra: 4-hour Tantric Taster"
-- (identical fingerprint, slipped Layer 2 because rows were inserted in the
-- same ingestion run before the fingerprint was checked).
-- Keeper: 1341b95f-83d7-4f44-a8f1-57b7b6e2636d (slug without random suffix)
UPDATE events
SET status = 'archived',
    rejection_reason = 'duplicate of 1341b95f-83d7-4f44-a8f1-57b7b6e2636d (same content_fingerprint)'
WHERE id = '4afeec94-f8b9-4ae5-8a60-cffeb0f56ebb' AND status != 'archived';

-- 3. Normalise recurrence_rule to JSON shape -------------------------------
-- Helper expression: cast known patterns to the JSON our parser understands.

-- 3a. RRULE strings (with or without "RRULE:" prefix) → JSON
UPDATE events
SET recurrence_rule = '{"frequency":"weekly","day_of_week":1}'
WHERE recurrence_rule IN ('FREQ=WEEKLY;BYDAY=MO', 'RRULE:FREQ=WEEKLY;BYDAY=MO');

UPDATE events
SET recurrence_rule = '{"frequency":"weekly","day_of_week":2}'
WHERE recurrence_rule IN ('FREQ=WEEKLY;BYDAY=TU', 'RRULE:FREQ=WEEKLY;BYDAY=TU');

UPDATE events
SET recurrence_rule = '{"frequency":"weekly","day_of_week":3}'
WHERE recurrence_rule IN ('FREQ=WEEKLY;BYDAY=WE', 'RRULE:FREQ=WEEKLY;BYDAY=WE');

UPDATE events
SET recurrence_rule = '{"frequency":"weekly","day_of_week":4}'
WHERE recurrence_rule IN ('FREQ=WEEKLY;BYDAY=TH', 'RRULE:FREQ=WEEKLY;BYDAY=TH');

UPDATE events
SET recurrence_rule = '{"frequency":"weekly","day_of_week":5}'
WHERE recurrence_rule IN ('FREQ=WEEKLY;BYDAY=FR', 'RRULE:FREQ=WEEKLY;BYDAY=FR');

UPDATE events
SET recurrence_rule = '{"frequency":"weekly","day_of_week":6}'
WHERE recurrence_rule IN ('FREQ=WEEKLY;BYDAY=SA', 'RRULE:FREQ=WEEKLY;BYDAY=SA');

UPDATE events
SET recurrence_rule = '{"frequency":"weekly","day_of_week":0}'
WHERE recurrence_rule IN ('FREQ=WEEKLY;BYDAY=SU', 'RRULE:FREQ=WEEKLY;BYDAY=SU');

-- 3b. Natural-language weekly patterns
UPDATE events SET recurrence_rule = '{"frequency":"weekly","day_of_week":1}'
WHERE recurrence_rule IN ('Every Monday', 'Weekly on Monday', 'weekly on Monday', 'Mondays');
UPDATE events SET recurrence_rule = '{"frequency":"weekly","day_of_week":2}'
WHERE recurrence_rule IN ('Every Tuesday', 'Weekly on Tuesday', 'Tuesdays');
UPDATE events SET recurrence_rule = '{"frequency":"weekly","day_of_week":3}'
WHERE recurrence_rule IN ('Every Wednesday', 'Weekly on Wednesday', 'Wednesdays');
UPDATE events SET recurrence_rule = '{"frequency":"weekly","day_of_week":4}'
WHERE recurrence_rule IN ('Every Thursday', 'Weekly on Thursday', 'Thursdays');
UPDATE events SET recurrence_rule = '{"frequency":"weekly","day_of_week":5}'
WHERE recurrence_rule IN ('Every Friday', 'Weekly on Friday', 'Fridays');
UPDATE events SET recurrence_rule = '{"frequency":"weekly","day_of_week":6}'
WHERE recurrence_rule IN ('Every Saturday', 'Weekly on Saturday', 'Saturdays');
UPDATE events SET recurrence_rule = '{"frequency":"weekly","day_of_week":0}'
WHERE recurrence_rule IN ('Every Sunday', 'Weekly on Sunday', 'Sundays');

-- 3c. Biweekly natural language
UPDATE events SET recurrence_rule = '{"frequency":"biweekly","day_of_week":0}'
WHERE recurrence_rule = 'Alternating Sunday';

-- 3d. Monthly natural language we can express
UPDATE events SET recurrence_rule = '{"frequency":"monthly"}'
WHERE recurrence_rule = 'Monthly';

-- 3e. Patterns we can't faithfully express (irregular session lists, "second
-- Friday", "last Sunday", etc.) — set is_recurring=false and clear the rule
-- so they're treated as one-off events instead of silently sticking on the
-- seed date forever.
UPDATE events
SET is_recurring = false,
    recurrence_rule = NULL
WHERE recurrence_rule IS NOT NULL
  AND recurrence_rule NOT LIKE '{%';
