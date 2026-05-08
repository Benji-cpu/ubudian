-- Native intent_tags on events. Replaces the v1 INTENT_TO_PRIMARY_CATEGORY mapping
-- by letting events carry the same intent vocabulary used by guides.
--
-- Backfill is conservative: only categories with a 1:1 mapping get tagged.
-- Ambiguous categories ('Dance & Movement', 'Yoga & Meditation', 'Healing &
-- Bodywork', 'Music & Performance', 'Retreat & Training', 'Other') stay empty
-- so the editor can decide.

alter table events
  add column if not exists intent_tags text[] not null default '{}';

create index if not exists events_intent_tags_gin
  on events using gin (intent_tags);

update events set intent_tags = array['romance']
  where category = 'Tantra & Intimacy' and intent_tags = '{}';

update events set intent_tags = array['community']
  where category = 'Circle & Community' and intent_tags = '{}';

update events set intent_tags = array['spirit']
  where category = 'Ceremony & Sound' and intent_tags = '{}';

update events set intent_tags = array['local_culture']
  where category = 'Art & Culture' and intent_tags = '{}';
