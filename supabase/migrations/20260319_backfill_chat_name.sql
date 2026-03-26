-- Backfill chat_name from raw_data for existing messages

-- Telegram: extract chat title from raw_data
UPDATE raw_ingestion_messages
SET chat_name = raw_data->'message'->'chat'->>'title'
WHERE chat_name IS NULL
  AND raw_data->'message'->'chat'->>'title' IS NOT NULL;

-- WhatsApp: use group ID as fallback
UPDATE raw_ingestion_messages
SET chat_name = raw_data->'payload'->>'from'
WHERE chat_name IS NULL
  AND raw_data->'payload'->>'from' LIKE '%@g.us';
