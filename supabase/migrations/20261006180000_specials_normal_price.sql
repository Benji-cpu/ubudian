-- The venue's normal price for the same thing, so a deal can be checked against the 25% rule
-- (Code/handovers/2026-10-06-what-is-a-deal.md). Optional, private: never in PUBLIC_SPECIAL_COLUMNS.
ALTER TABLE specials ADD COLUMN IF NOT EXISTS normal_price_idr integer CHECK (normal_price_idr IS NULL OR normal_price_idr >= 0);
