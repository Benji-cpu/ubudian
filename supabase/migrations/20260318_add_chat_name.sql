-- Add chat_name column to raw_ingestion_messages
-- Stores the name of the group/chat the message was received from
ALTER TABLE raw_ingestion_messages ADD COLUMN chat_name TEXT;
