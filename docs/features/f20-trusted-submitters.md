# F20: Trusted Submitters

**Phase:** 4 — Events Directory
**Depends on:** F19
**Blocks:** None

---

## What

Track submitter reliability. After 5+ approved events, their submissions auto-approve to reduce your moderation workload.

## Spec

### Logic
- When an event is approved: increment `approved_count` for that submitter email in `trusted_submitters` table
- When `approved_count >= 5`: set `auto_approve = true`
- When a new event is submitted by a trusted submitter: automatically set status to `published` (skip pending)
- Admin can manually toggle `auto_approve` for any submitter (override)
- Trusted submitters show a subtle "Trusted" badge in moderation queue

### Admin View
- Subscriber management section or within moderation settings
- Table: email, approved count, auto_approve status, toggle button

## Verification

- Submit 5 events from same email, approve all → 6th submission auto-publishes
- Admin can manually toggle trusted status
- Trusted badge appears in moderation queue
