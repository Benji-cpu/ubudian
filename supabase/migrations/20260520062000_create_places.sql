-- Places: lightweight venue profiles (temples, cafes, studios, retreat centres).
-- Phase 3 of guides. Modelled on `practitioners` (profile-shaped, not commercial
-- like `partners`). Defaults `is_published=false` so editors deliberately opt
-- each row into the public surface.

create table places (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  kind text not null check (kind in (
    'temple','venue','cafe','restaurant','studio','spa','retreat_centre',
    'natural','market','other'
  )),
  description text,
  short_description text,
  photo_urls text[] not null default '{}',
  hero_image_url text,
  address text,
  neighbourhood text,
  latitude numeric,
  longitude numeric,
  google_maps_url text,
  website_url text,
  instagram_handle text,
  opening_hours text,
  price_range text,
  theme_tags text[] not null default '{}',
  archetype_tags text[] not null default '{}',
  intent_tags text[] not null default '{}',
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index places_kind_idx on places(kind);
create index places_published_idx on places(is_published, sort_order);
create index places_theme_tags_gin on places using gin (theme_tags);
create index places_archetype_tags_gin on places using gin (archetype_tags);
create index places_intent_tags_gin on places using gin (intent_tags);

alter table places enable row level security;

create policy "places_public_read"
  on places for select
  using (is_published = true);

create policy "places_admin_all"
  on places for all
  using (is_admin())
  with check (is_admin());

-- Keep updated_at fresh on edits. Mirrors the pattern used by guides.
create or replace function places_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger places_updated_at
  before update on places
  for each row
  execute function places_set_updated_at();
