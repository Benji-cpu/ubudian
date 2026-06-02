-- Personalisation engine foundation: semantic embeddings + a finer "vibe" tag
-- layer, plus the similarity / taste-vector RPCs the feed and quiz spread use.
--
-- Context: events.archetype_tags is already populated (the quiz<->event bridge),
-- but there's no event<->event similarity and no behavioural signal from hearts.
-- This adds:
--   * pgvector embeddings (Gemini text-embedding-004, 768 dims) for true
--     semantic "more like this" + a per-user taste vector from saved_events.
--   * vibe_tags: a controlled, behind-the-scenes facet vocabulary (Jaccard
--     overlap) that sharpens + explains similarity.
-- Embeddings/vibe_tags are backfilled async by scripts + the nightly sweep, so
-- both columns are nullable / default-empty and never block live ingestion.

create extension if not exists vector;

-- ── events ──────────────────────────────────────────────────────────────────
alter table events
  add column if not exists embedding vector(768),
  add column if not exists vibe_tags text[] not null default '{}';

create index if not exists events_vibe_tags_gin on events using gin (vibe_tags);

-- HNSW (not ivfflat): needs no training data and keeps good recall at this
-- corpus size (~hundreds of rows) and as it grows. Cosine distance via `<=>`.
create index if not exists events_embedding_hnsw
  on events using hnsw (embedding vector_cosine_ops);

-- ── experiences (small table; used by the post-quiz spread + archetype match) ─
alter table experiences
  add column if not exists embedding vector(768),
  add column if not exists vibe_tags text[] not null default '{}';

-- ── RPCs (supabase-js can't express the `<=>` operator directly) ─────────────

-- "More like this" for a single event — cosine nearest neighbours, approved only.
create or replace function match_events_by_embedding(
  query_embedding vector(768),
  match_count int default 6,
  exclude_id uuid default null
) returns table (id uuid, similarity float)
language sql stable as $$
  select e.id, 1 - (e.embedding <=> query_embedding) as similarity
  from events e
  where e.status = 'approved'
    and e.embedding is not null
    and (exclude_id is null or e.id <> exclude_id)
  order by e.embedding <=> query_embedding
  limit match_count;
$$;

-- A user's taste vector = centroid of the embeddings of events they've hearted.
-- NULL when they have no (embedded) saves — callers treat that as "no signal".
create or replace function user_taste_vector(p_profile_id uuid)
returns vector(768)
language sql stable as $$
  select avg(e.embedding)::vector(768)
  from saved_events s
  join events e on e.id = s.event_id
  where s.profile_id = p_profile_id
    and e.embedding is not null;
$$;

-- An archetype's centroid = mean embedding of approved events tagged with it.
-- Lets the quiz spread widen beyond exact tag matches into semantically-near
-- events. NULL when nothing is tagged/embedded for that archetype yet.
create or replace function archetype_centroid(p_archetype text)
returns vector(768)
language sql stable as $$
  select avg(e.embedding)::vector(768)
  from events e
  where e.status = 'approved'
    and e.embedding is not null
    and e.archetype_tags @> array[p_archetype]::text[];
$$;
