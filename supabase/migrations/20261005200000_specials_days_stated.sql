-- A deal can come from a source that gives its hours but not its days ("five
-- cocktails 95k, 5–8pm"). In `specials`, an empty weekdays list means every day,
-- so such a row could only be hidden (Reviewer, review log §9) or overclaim.
-- days_stated = false says "the source gives no days": the row keeps weekdays
-- empty, never counts as running on a particular day, and shows "days not stated".
-- Default true keeps every existing row as it is.
ALTER TABLE specials ADD COLUMN IF NOT EXISTS days_stated boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN specials.days_stated IS
  'false = the source gives no days; weekdays is empty and the page says "days not stated" instead of "every day".';
