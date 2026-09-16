-- commission_partners and commission_payouts were created 2026-05-27 and never
-- queried by any code path (zero references in src/ on 2026-09-15, zero rows).
-- subscriptions.commission_partner_id / commission_attribution_source stay:
-- they are nullable columns, cheap to keep, and the only record that the idea
-- existed. Apply with scripts/apply-migration.ts.
--
-- Keeping that column means keeping a foreign key INTO the table being
-- dropped, which is why the first attempt (2026-09-16) rolled back on
-- "cannot drop table commission_partners because other objects depend on it".
-- The constraint is dropped explicitly rather than with CASCADE so the column
-- survives and nothing unnamed goes with it. Of the 2 subscriptions that
-- exist, 0 reference a partner, so no data is orphaned.
DROP TABLE IF EXISTS commission_payouts;

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_commission_partner_id_fkey;

DROP TABLE IF EXISTS commission_partners;
