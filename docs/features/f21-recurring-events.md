# F21: Recurring Events

**Phase:** 4 — Events Directory
**Depends on:** F11
**Blocks:** None

---

## What

Support for events that repeat on a schedule (weekly yoga class, monthly full moon ceremony, etc.).

## Spec

### Data Model
- `is_recurring: boolean` — flag on events table
- `recurrence_rule: text` — pattern string, e.g.:
  - `WEEKLY:MON` (every Monday)
  - `WEEKLY:TUE,THU` (every Tuesday and Thursday)
  - `MONTHLY:FIRST_SAT` (first Saturday of each month)
  - `MONTHLY:15` (15th of each month)

### Display Logic
- Recurring events show a "Recurring" badge on cards
- Individual detail page shows: "Every Tuesday" or "First Saturday of each month"
- In calendar/week views: recurring events generate instances for each occurrence within the visible date range
- List view: show the next upcoming occurrence, with a note "Repeats weekly"

### Admin
- Toggle "Recurring" in event form
- If recurring: show recurrence pattern selector (frequency dropdown + day selector)
- Option to set end date for recurrence (optional — defaults to ongoing)

### Instance Generation
- Don't store individual instances in the database (that creates data bloat)
- Generate instances dynamically when querying for a date range
- Supabase function or application-level logic to expand recurrence rules into dates

### Editing Recurring Events
- "Edit all future occurrences" (changes the template)
- "Cancel this occurrence" (add an exception date)
- Keep it simple for MVP — editing changes all future, no per-instance editing

## Verification

- Create a weekly recurring event → appears on correct days in calendar/week views
- Recurring badge shows on cards
- Detail page shows recurrence pattern
- Edit recurring event → all future instances update
