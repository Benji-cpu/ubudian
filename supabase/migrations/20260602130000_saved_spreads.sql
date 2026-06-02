-- A "custom spread" is the curated set the quiz hands a taker: their archetype
-- plus the events + experiences picked for them. It's a snapshot in time, NOT a
-- bag of individual hearts — so it lives in its own table rather than polluting
-- saved_events (which feeds the taste vector). Persisted server-side for
-- logged-in takers; the same spread is also emailed so it isn't lost when they
-- start browsing the general feed.

create table if not exists saved_spreads (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  quiz_result_id uuid references quiz_results(id) on delete set null,
  primary_archetype text not null,
  secondary_archetype text,
  event_ids uuid[] not null default '{}',
  experience_ids uuid[] not null default '{}',
  created_at timestamptz default now()
);

alter table saved_spreads enable row level security;

create policy "Users read own spreads"
  on saved_spreads for select
  to authenticated
  using (profile_id = auth.uid());

create policy "Users insert own spreads"
  on saved_spreads for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "Users delete own spreads"
  on saved_spreads for delete
  to authenticated
  using (profile_id = auth.uid());

create policy "Admins manage spreads"
  on saved_spreads for all
  using (public.is_admin());

create index if not exists idx_saved_spreads_profile on saved_spreads(profile_id);
