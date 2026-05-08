-- saved_guides: user bookmarks. Mirrors saved_journeys pattern.
create table saved_guides (
  profile_id uuid not null references profiles(id) on delete cascade,
  guide_id uuid not null references guides(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, guide_id)
);

create index saved_guides_profile_created
  on saved_guides (profile_id, created_at desc);

alter table saved_guides enable row level security;

create policy "saved_guides_owner_select"
  on saved_guides for select
  using (auth.uid() = profile_id);

create policy "saved_guides_owner_insert"
  on saved_guides for insert
  with check (auth.uid() = profile_id);

create policy "saved_guides_owner_delete"
  on saved_guides for delete
  using (auth.uid() = profile_id);
