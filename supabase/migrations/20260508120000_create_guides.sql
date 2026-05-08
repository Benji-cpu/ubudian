-- Guides: free, locally-rooted content. Two tiers (practical / intent) sharing one table and one taxonomy surface.

create table guides (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  tier text not null check (tier in ('practical', 'intent')),
  title text not null,
  subtitle text,
  hero_quote text,
  intro_md text,
  body_md text not null,
  intent_tags text[] not null default '{}',
  archetype_tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_members_only boolean not null default false,
  is_editors_pick boolean not null default false,
  editors_pick_position int,
  reading_time_min int,
  hero_image_url text,
  card_image_url text,
  linked_retreat_id uuid references journeys(id) on delete set null,
  related_guide_slugs text[] not null default '{}',
  field_tested_by text,
  last_updated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order int not null default 0
);

create index guides_status_published_at_idx on guides (status, published_at desc);
create index guides_tier_idx on guides (tier);
create index guides_intent_tags_gin on guides using gin (intent_tags);
create index guides_archetype_tags_gin on guides using gin (archetype_tags);

alter table guides enable row level security;

create policy "guides_public_read" on guides
  for select using (status = 'published');

create policy "guides_admin_all" on guides
  for all using (is_admin())
  with check (is_admin());
