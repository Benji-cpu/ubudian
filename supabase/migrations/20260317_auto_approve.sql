-- Add auto-approve settings to event_sources
ALTER TABLE event_sources ADD COLUMN auto_approve_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE event_sources ADD COLUMN auto_approve_threshold REAL DEFAULT 0.85;

-- Add quality assessment columns to events
ALTER TABLE events ADD COLUMN quality_score REAL;
ALTER TABLE events ADD COLUMN content_flags TEXT[] DEFAULT '{}';
