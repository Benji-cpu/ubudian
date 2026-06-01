-- Archive stale-Megatix phantom events — 2026-06-01
--
-- Systemic year-roll cleanup. Each of these approved single/multi-day events was
-- ingested from a no-year Megatix slug; the LLM parser stamped the CURRENT year
-- onto a past edition, creating a phantom future listing with a dead CTA. Every
-- URL below was verified today against its live Megatix page (JSON-LD startDate +
-- "This event has already taken place"):
--   kintsugi-...-june-5th            → 2022-06-05
--   kintsugi-...-june-26th           → 2022-06-26
--   beauty-way-jun                   → 2024-06-29
--   new-moon-bhakti-kirtan-june      → 2024-07-06
--   beauty-way-july                  → 2023-07-08
--   ilahi-sufi-qawwali-...-ecstasy   → 2023-06-17  (was "verified 200" 2026-05-26 — 200 ≠ current)
--   awakening-the-heart-ubud         → 2025-08-23..24
-- Matched on the unique external_ticket_url to avoid touching look-alikes.
UPDATE events
SET status = 'archived',
    moderation_reason = 'stale_megatix_phantom_2026-06-01',
    updated_at = now()
WHERE status = 'approved'
  AND is_recurring = false
  AND external_ticket_url IN (
    'https://megatix.co.id/events/kintsugi-at-dragon-tea-temple-june-5th',
    'https://megatix.co.id/events/kintsugi-at-dragon-tea-temple-june-26th',
    'https://megatix.co.id/events/beauty-way-jun',
    'https://megatix.co.id/events/new-moon-bhakti-kirtan-june',
    'https://megatix.co.id/events/beauty-way-july',
    'https://megatix.co.id/events/ilahi-sufi-qawwali-ceremonial-ecstasy',
    'https://megatix.co.id/events/awakening-the-heart-ubud'
  );

-- YUJOY "Live Concert" (DB date Jun 8 2026): its only ticket link resolves to a
-- Dec 12 2024 Singapore-Megatix edition — the future date was inferred elsewhere
-- and never confirmed. A headline concert 7 days out with a dead 2024 CTA is not
-- credible; archive. If a real edition surfaces, the curator re-ingests it.
UPDATE events
SET status = 'archived',
    moderation_reason = 'stale_megatix_unconfirmed_2026-06-01',
    updated_at = now()
WHERE status = 'approved'
  AND is_recurring = false
  AND external_ticket_url = 'https://megatix.com.sg/events/resonanz-dance-x-yujoyvc';

-- CREMOSO Zouk Social carried a WhatsApp group-invite link in external_ticket_url
-- — a forbidden scout-channel domain that must never become a public CTA
-- (curator/playbook.md attribution rules). Clear it; the card renders without a
-- button. (Applied same-session via execute_sql; statement kept here for audit.)
UPDATE events
SET external_ticket_url = NULL, updated_at = now()
WHERE status = 'approved'
  AND external_ticket_url = 'https://chat.whatsapp.com/LwuGyXg1xRlACons5JYJTF?mode=gi_t';
