-- Reconfirm ping for "Tonight in Ubud" specials.
--
-- `confirm_token` is the private link a venue gets ("still running?"), by
-- email now and in the first WhatsApp message later. Unguessable, so the link
-- needs no login and no signing key. `reconfirm_sent_at` stops the nightly
-- run asking the same venue twice in a week.
ALTER TABLE specials ADD COLUMN IF NOT EXISTS confirm_token uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE specials ADD COLUMN IF NOT EXISTS reconfirm_sent_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS specials_confirm_token_idx ON specials (confirm_token);
