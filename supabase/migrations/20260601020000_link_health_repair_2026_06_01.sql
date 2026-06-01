-- Full link-health repair sweep — 2026-06-01
-- Verified EVERY approved-event external_ticket_url against its live page
-- (HTTP status + JSON-LD startDate + stale markers). Actions:

-- Dance of the Dragonfly (Sunset Somatic + Expanded): the megatix slug
-- `dance-of-the-dragonfly` now serves "already taken place". The venue's own
-- page is live and current ("Every Wednesday 5:30–7PM", booking link, Mar 2026
-- activity) — a better CTA than a dead ticketing slug. Repoint both rows.
UPDATE events SET external_ticket_url = 'https://dragonfly-village.com/activity/dance-of-the-dragonfly/', updated_at = now()
WHERE id IN ('cba53420-44e1-4aaf-920a-65552dc541b3','95eb2953-07b5-4e47-9b69-e14fc4450468')
  AND status = 'approved';

-- Vibración (megatix JSON-LD 2018-07-08, "already taken place") — dead slug,
-- no venue-owned ticketing alternative. Clear; card renders without a CTA.
UPDATE events SET external_ticket_url = NULL, updated_at = now()
WHERE id = 'df358185-f7cd-4ebb-8d96-2991f5a38d19' AND status = 'approved';

-- Shamanic Breathwork with Jane (megatix "already taken place") — clear.
UPDATE events SET external_ticket_url = NULL, updated_at = now()
WHERE id = '85c59898-2c9d-43ca-8aaf-d2bad326337f' AND status = 'approved';

-- Full Moon Kirtan & Sacred Tea (megatix `...-15june`, JSON-LD 2022-06-15,
-- "already taken place") — a fixed past edition, not the recurring instance.
-- Clear; the linktr.ee source stays as provenance only (not a public CTA).
UPDATE events SET external_ticket_url = NULL, updated_at = now()
WHERE id = '92f30c11-aa73-4ecf-8030-fa34843b2e67' AND status = 'approved';

-- CREMOSO Zouk Social: Benji confirmed an event-owned WhatsApp invite is a fine
-- CTA (it's the gathering's own signup channel, not a competitor aggregator).
-- Restore it. The forbidden-domain rule targets scout/aggregator links, not a
-- host's own community channel — see curator/playbook.md update this session.
UPDATE events SET external_ticket_url = 'https://chat.whatsapp.com/LwuGyXg1xRlACons5JYJTF?mode=gi_t', updated_at = now()
WHERE id = 'a273516f-2015-40ff-90a7-2971a49e9d6d' AND status = 'approved';
