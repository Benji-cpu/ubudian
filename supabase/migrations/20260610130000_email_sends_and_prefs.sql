-- Shared infra for outbound personalised email (weekly For-You digest +
-- saved-event reminders). transactional_sends is the idempotency ledger:
-- cron routes INSERT the dedupe_key BEFORE sending, so a re-run (GH Actions
-- retry, manual dispatch) can never double-send. All writes go through
-- createAdminClient() in API routes — RLS is admin-only.

create table if not exists transactional_sends (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                -- 'reminder' | 'digest' | future kinds
  email text not null,
  dedupe_key text not null unique,   -- e.g. reminder:<profile>:<event>:<date>, digest:<profile>:<isoweek>
  sent_at timestamptz default now()
);

alter table transactional_sends enable row level security;

create policy "Admins manage transactional sends"
  on transactional_sends for all
  using (public.is_admin());

create index if not exists idx_transactional_sends_kind_email
  on transactional_sends(kind, email);

-- One opt-out flag covers all personalised transactional email (digest +
-- reminders). 17 profiles today does not justify granular preferences.
alter table profiles add column if not exists email_opt_out boolean not null default false;

-- Audit stamp for organizer self-serve edits (Workstream E4): when a
-- submitter edits their own published event, the morning routine can find
-- recently-edited rows without diffing.
alter table events add column if not exists last_edited_by_submitter_at timestamptz;
