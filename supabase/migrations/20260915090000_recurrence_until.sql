-- One recurrence format, with the series end inside the rule.
--
-- Before this, `events.recurrence_rule` held four shapes (JSON, RRULE, free
-- text, NULL-with-is_recurring) and the series end lived in three places
-- (free text "until …", RRULE UNTIL=, and — for 174 todo.today rows — the
-- event's `end_date`). The feed read that last one as a months-long event in
-- progress and pinned every weekly class under "Today". The gate held 15
-- Megatix rows a night for a NULL rule.
--
-- Applied 2026-09-15 statement by statement through a pg client (the CLI's
-- migration history is out of sync with the remote; see MEMORY.md). The
-- RRULE/free-text → JSON conversion (28 rows) was applied by
-- `scripts/normalize-recurrence.ts --apply`, which uses the same
-- `normalizeRecurrenceRule()` the pipeline now runs on insert, so the data
-- and the code cannot disagree.

-- 0. One malformed row: three JSON objects glued together (Tue/Thu/Sat).
UPDATE events
SET recurrence_rule = '{"frequency":"weekly","day_of_week":[2,4,6]}'
WHERE recurrence_rule LIKE '{%},{%';

-- 1. A recurring flag with no rule is a one-off on its date.
UPDATE events
SET is_recurring = false
WHERE is_recurring AND (recurrence_rule IS NULL OR btrim(recurrence_rule) = '');

-- 2. A recurring row's end_date is the series end: fold it into the JSON rule.
UPDATE events
SET recurrence_rule = (recurrence_rule::jsonb || jsonb_build_object('until', end_date::text))::text,
    end_date = NULL
WHERE is_recurring
  AND recurrence_rule LIKE '{%'
  AND end_date IS NOT NULL
  AND end_date > start_date
  AND NOT (recurrence_rule::jsonb ? 'until');

-- 3. Whatever end_date is left on a recurring row is not a span.
UPDATE events
SET end_date = NULL
WHERE is_recurring AND end_date IS NOT NULL;

-- 4. (scripts/normalize-recurrence.ts --apply) RRULE and free-text rules → JSON.

-- 5. Only JSON from here on. Every write path normalises first.
ALTER TABLE events
  ADD CONSTRAINT events_recurrence_rule_json_check
  CHECK (recurrence_rule IS NULL OR recurrence_rule LIKE '{%');
