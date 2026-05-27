-- Paid membership upgrades:
--   1. Indonesian-card payment review gate on subscriptions
--   2. Per-event gating (is_members_only + members_only_teaser)
--   3. Commission partners + payouts (organizer attribution)
--
-- Order matters: commission_partners is created BEFORE subscriptions is altered
-- (subscriptions.commission_partner_id FKs to it).

-- 1. commission_partners ------------------------------------------------------

CREATE TABLE IF NOT EXISTS commission_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  commission_pct NUMERIC(5,2) NOT NULL DEFAULT 30.00 CHECK (commission_pct >= 0 AND commission_pct <= 100),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  bio TEXT,
  avatar_url TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_partners_handle ON commission_partners(handle);
CREATE INDEX IF NOT EXISTS idx_commission_partners_active ON commission_partners(is_active) WHERE is_active;

ALTER TABLE commission_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active commission partners" ON commission_partners;
CREATE POLICY "Public can read active commission partners"
  ON commission_partners FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins manage commission partners" ON commission_partners;
CREATE POLICY "Admins manage commission partners"
  ON commission_partners FOR ALL
  USING (public.is_admin());

-- 2. Subscriptions: payment review + commission attribution -------------------

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='payment_country') THEN
    ALTER TABLE subscriptions ADD COLUMN payment_country TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='payment_last4') THEN
    ALTER TABLE subscriptions ADD COLUMN payment_last4 TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='review_status') THEN
    ALTER TABLE subscriptions ADD COLUMN review_status TEXT NOT NULL DEFAULT 'auto_approved'
      CHECK (review_status IN ('auto_approved','pending_review','approved','rejected'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='review_notes') THEN
    ALTER TABLE subscriptions ADD COLUMN review_notes TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='reviewed_by') THEN
    ALTER TABLE subscriptions ADD COLUMN reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='reviewed_at') THEN
    ALTER TABLE subscriptions ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='commission_partner_id') THEN
    ALTER TABLE subscriptions ADD COLUMN commission_partner_id UUID REFERENCES commission_partners(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='commission_attribution_source') THEN
    ALTER TABLE subscriptions ADD COLUMN commission_attribution_source TEXT
      CHECK (commission_attribution_source IN ('cookie','utm','manual','partner_page'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_review_pending
  ON subscriptions (review_status) WHERE review_status = 'pending_review';

CREATE INDEX IF NOT EXISTS idx_subscriptions_commission_partner
  ON subscriptions (commission_partner_id) WHERE commission_partner_id IS NOT NULL;

-- 3. Events: per-event gating + admin-authored teaser -------------------------

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='is_members_only') THEN
    ALTER TABLE events ADD COLUMN is_members_only BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='members_only_teaser') THEN
    ALTER TABLE events ADD COLUMN members_only_teaser TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_members_only ON events (is_members_only) WHERE is_members_only;

-- 4. commission_payouts -------------------------------------------------------

CREATE TABLE IF NOT EXISTS commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES commission_partners(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  signups_count INTEGER NOT NULL DEFAULT 0,
  gross_cents INTEGER NOT NULL DEFAULT 0,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','void')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_period_range CHECK (period_start <= period_end)
);

CREATE INDEX IF NOT EXISTS idx_commission_payouts_partner ON commission_payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_status ON commission_payouts(status);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_period
  ON commission_payouts(partner_id, period_start, period_end);

ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage commission payouts" ON commission_payouts;
CREATE POLICY "Admins manage commission payouts"
  ON commission_payouts FOR ALL
  USING (public.is_admin());

-- 5. Backfill: existing subscriptions get review_status='auto_approved' ------
-- (Default value handles new rows; this is belt-and-braces for any pre-existing.)
UPDATE subscriptions
  SET review_status = 'auto_approved'
  WHERE review_status IS NULL;
