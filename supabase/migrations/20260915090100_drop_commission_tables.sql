-- commission_partners and commission_payouts were created 2026-05-27 and never
-- queried by any code path (zero references in src/ on 2026-09-15, zero rows).
-- subscriptions.commission_partner_id / commission_attribution_source stay:
-- they are nullable columns, cheap to keep, and the only record that the idea
-- existed. Apply with scripts/apply-migration.ts.
DROP TABLE IF EXISTS commission_payouts;
DROP TABLE IF EXISTS commission_partners;
