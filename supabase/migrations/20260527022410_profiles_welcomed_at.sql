-- Add welcomed_at column to profiles for first-login onboarding gate.
-- Backfill existing profiles so we don't pop a welcome modal at users who've already been around.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS welcomed_at TIMESTAMPTZ;

UPDATE profiles
SET welcomed_at = COALESCE(welcomed_at, created_at)
WHERE welcomed_at IS NULL;
