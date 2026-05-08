-- Reverse cross-link join table: which guides mention which entities.
-- Populated atomically on guide save by sync_guide_references() RPC.

create table guide_entity_references (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guides(id) on delete cascade,
  ref_kind text not null check (ref_kind in ('event','story','retreat','practitioner','place','partner')),
  ref_slug text not null,
  ref_id uuid,
  position int,
  created_at timestamptz not null default now(),
  unique (guide_id, ref_kind, ref_slug)
);

create index guide_entity_references_lookup
  on guide_entity_references (ref_kind, ref_slug);

create index guide_entity_references_guide
  on guide_entity_references (guide_id);

alter table guide_entity_references enable row level security;

-- Public can read references for published guides only — that's how the
-- "Mentioned in [guide]" cross-link pulls data on event/story/journey pages.
create policy "guide_entity_references_public_read"
  on guide_entity_references
  for select
  using (
    exists (
      select 1 from guides g
      where g.id = guide_id and g.status = 'published'
    )
  );

create policy "guide_entity_references_admin_all"
  on guide_entity_references
  for all
  using (is_admin())
  with check (is_admin());

-- Atomic delete-then-insert. Caller passes the guide id and a JSONB array of
-- references parsed from the body. Function wipes existing rows for that guide
-- and inserts the new set inside one transaction.
--
-- Expected `refs` shape:
--   [{ "kind": "event", "slug": "tuesday-cacao", "position": 0 }, ...]
create or replace function sync_guide_references(
  p_guide_id uuid,
  p_refs jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ref jsonb;
  pos int := 0;
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;

  delete from guide_entity_references where guide_id = p_guide_id;

  for ref in select * from jsonb_array_elements(p_refs)
  loop
    insert into guide_entity_references (
      guide_id, ref_kind, ref_slug, position
    ) values (
      p_guide_id,
      ref->>'kind',
      ref->>'slug',
      coalesce((ref->>'position')::int, pos)
    )
    on conflict (guide_id, ref_kind, ref_slug) do nothing;
    pos := pos + 1;
  end loop;
end;
$$;

revoke all on function sync_guide_references(uuid, jsonb) from public;
grant execute on function sync_guide_references(uuid, jsonb) to authenticated;
