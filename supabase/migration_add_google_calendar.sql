-- Run this once in the Supabase SQL editor to add Google Calendar sync
-- support to an existing live database (non-destructive -- does not touch
-- existing rows or drop anything).
--
-- Security note: google_calendar_connections stores OAuth access/refresh
-- tokens in plaintext. This is a deliberate MVP simplification -- the table
-- is only ever read/written by the backend's service-role Supabase client
-- and is never sent to the frontend, but it is not encrypted at rest.
-- Revisit before any real production use.

alter table public.calendar_events
  add column if not exists external_event_id text,
  add column if not exists source text not null default 'manual',
  add column if not exists last_synced_at timestamp with time zone;

alter table public.calendar_events
  drop constraint if exists calendar_events_source_check;
alter table public.calendar_events
  add constraint calendar_events_source_check check (source in ('manual', 'google_calendar'));

-- Partial unique index (not a plain UNIQUE constraint) so multiple manual/seed
-- events with external_event_id = null can still coexist.
drop index if exists calendar_events_user_external_id_key;
create unique index calendar_events_user_external_id_key
  on public.calendar_events (user_id, external_event_id)
  where external_event_id is not null;

create table if not exists public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  token_expiry timestamp with time zone,
  scope text,
  connected_at timestamp with time zone not null default now(),
  last_synced_at timestamp with time zone
);

-- Quick sanity check after migrating, e.g. in the Supabase SQL editor:
-- select column_name from information_schema.columns where table_name = 'calendar_events';
-- select * from public.google_calendar_connections;
