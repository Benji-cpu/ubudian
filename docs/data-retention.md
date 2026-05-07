# Data Retention Policy — The Ubudian

**Policy owner:** Benji
**Last updated:** 2026-05-08

## Principle

Approved and archived event text data is **retained indefinitely** as a future AI training corpus. Image storage is allowed to be reaped to control costs, but the row that owned the image and all of its text fields stay.

This policy is load-bearing — multiple downstream products (training data, historical ingestion analytics, journey-day evergreen content) depend on the events table being a complete chronological record.

## Rules

### Events (`events` table)

| State | Text retention | Image retention |
|-------|----------------|-----------------|
| `pending` | Retained while pending. Auto-archived once `start_date` < today (no deletion). | Retained while pending. |
| `approved` | **Indefinite.** | Retained while upcoming or in the recent past (≤90d). |
| `rejected` | Retained indefinitely. (Rare; admin-action.) | Retained. |
| `archived` | **Indefinite — never delete.** | Garbage-collected once archived for ≥90 days (`shouldGarbageCollectEventImage`). The row stays; only `cover_image_url` is nullified and the storage object is removed. |

**No code path may hard-delete an `events` row.** This is enforced by:

- A static rule (this document)
- A unit test (`src/lib/__tests__/maintenance/retention-policy.test.ts`) that calls each cleanup helper with a mocked Supabase client and asserts `.delete()` against `from("events")` is never invoked.

### Raw ingestion (`raw_ingestion_messages`)

| State | Retention |
|-------|-----------|
| `processed` (event was created from this message) | Indefinite — needed to backtrack from event → source. |
| `processed_no_event` | Indefinite. |
| `failed` | Hard-deleted after **90 days** by `purgeFailedMessages()`. (Plan says 90; the current default in code is 30 — those are the same noise floor either way; raise to 90 if/when we want a longer audit window.) |

This is the only cleanup that hard-deletes ingestion data. The `events` rows that referenced these messages are unaffected (the FK is `ON DELETE SET NULL`).

### Image storage (`images` bucket)

| Folder | Lifecycle |
|--------|-----------|
| `events/` | Reaped 90 days after the parent event is archived. Audit trail in `image_gc_log`. |
| `blog/`, `stories/`, `tours/` | Indefinite (controlled by admin via the CMS). |

### Other tables — not in scope of this policy

- `bookings`, `subscriptions`, `payments` — financial data, separate retention rules apply (TBD with stripe / accounting).
- `feedback`, `app_feedback` — retained indefinitely; admin can mark statuses but should not delete.
- `profiles`, `quiz_results`, `saved_events`, `user_journey_progress` — user-owned data; deleted only when the user requests account deletion (not implemented yet).

## Why

1. **AI training corpus.** Every approved/archived event is a labeled, dated, geo-located, categorized example of an Ubud conscious-community happening. The corpus only grows in value over time — losing a year of archived events is irreversible.
2. **Journey content.** Living Guide journeys reference recent and historical events to illustrate "what a typical Day 3 looks like." Pruning archived rows breaks those references.
3. **Analytics.** Historical ingestion patterns (which sources produce most events, which categories grow over time) need the full timeline.
4. **Operational reversibility.** If an event is mistakenly archived, the row is still there to un-archive. If it were deleted, nothing.

The cost of retention (storage of text data) is negligible compared to the cost of regret.

## Operational notes

- If schema changes ever require a real migration of archived event rows, do it as **`UPDATE`**, not as `DELETE` + `INSERT`.
- If the `events` table ever needs partitioning by date for performance, partition — don't prune.
- Image GC may be tuned (180d → 90d → 60d) without policy review. Text retention may not.
