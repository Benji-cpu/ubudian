-- Disable dead pull sources so the (now maxDuration=60) ingest-events cron
-- reliably reaches Megatix instead of being starved by sources that have
-- produced nothing for weeks:
--   - WhatsApp Groups   — last_fetched 2026-05-10; WAHA appears down. Its
--                          8–15s per-group jitter delays can eat the whole
--                          cron window if WAHA ever responds.
--   - Public Instagram (Apify) — last_fetched 2026-05-07; to be replaced by a
--                          free custom Instagram scraper (no paid Apify).
-- Telegram is deliberately LEFT ENABLED: the cron already skips it
-- (source_type='telegram' is filtered out), and its webhook handler requires
-- is_enabled=true to accept messages. Telegram's real problem is that the prod
-- webhook is unregistered (getWebhookInfo: url unset, 21 updates queued) — a
-- separate setWebhook fix, not an is_enabled change.
-- Megatix + Curator stay enabled.
UPDATE event_sources
SET is_enabled = false, updated_at = now()
WHERE slug IN ('whatsapp', 'apify-instagram') AND is_enabled = true;
