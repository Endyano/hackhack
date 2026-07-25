-- CareShift Supabase schema.
-- Safe to run against a disposable/local database: tables are dropped and
-- recreated in dependency order.

create extension if not exists pgcrypto;

drop table if exists public.activity_history cascade;
drop table if exists public.activity_invitations cascade;
drop table if exists public.friendships cascade;
drop table if exists public.activity_recommendations cascade;
drop table if exists public.daily_check_ins cascade;
drop table if exists public.google_calendar_connections cascade;
drop table if exists public.calendar_events cascade;
drop table if exists public.user_preferences cascade;
drop table if exists public.users cascade;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (length(trim(username)) > 0),
  name text not null,
  email text not null unique,
  experience_level text,
  primary_goal text,
  current_location text,
  carematch_enabled boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  preferred_activities text[] not null default '{}'::text[],
  disliked_activities text[] not null default '{}'::text[],
  friend_match_pref text
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  event_type text,
  -- Google Calendar sync fields. external_event_id is null for manual/seed
  -- events; the partial unique index below only enforces uniqueness where
  -- it's set, so multiple manual events can still coexist with null.
  external_event_id text,
  source text not null default 'manual' check (source in ('manual', 'google_calendar')),
  last_synced_at timestamp with time zone,
  constraint calendar_events_valid_time check (end_time > start_time)
);

create unique index calendar_events_user_external_id_key
  on public.calendar_events (user_id, external_event_id)
  where external_event_id is not null;

-- One Google Calendar connection per user. Service-role access only --
-- tokens here are never sent to the frontend. Plaintext for MVP speed;
-- see supabase/migration_add_google_calendar.sql for the security note.
create table public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  token_expiry timestamp with time zone,
  scope text,
  connected_at timestamp with time zone not null default now(),
  last_synced_at timestamp with time zone
);

create table public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  mood text,
  energy_level text,
  physical_readiness text,
  location text,
  additional_notes text,
  created_at timestamp with time zone not null default now()
);

create table public.activity_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  activity_name text not null,
  category text not null check (category in ('mental', 'physical', 'nutritional')),
  start_time timestamp with time zone not null,
  duration_minutes integer not null check (duration_minutes > 0),
  intensity text,
  reason text,
  status text not null default 'pending'
    check (status in (
      'pending',
      'accepted',
      'replaced',
      'shortened',
      'skipped',
      'completed',
      'partially_completed'
    )),
  created_at timestamp with time zone not null default now()
);

create table public.activity_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  recommendation_id uuid references public.activity_recommendations(id) on delete set null,
  completion_status text check (completion_status in ('completed', 'partially_completed', 'skipped')),
  feedback text,
  completed_at timestamp with time zone not null default now()
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  friend_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  carematch_enabled boolean not null default true,
  constraint friendships_no_self_friend check (user_id <> friend_id)
);

create table public.activity_invitations (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  recommendation_id uuid references public.activity_recommendations(id) on delete set null,
  activity_name text not null,
  proposed_start timestamp with time zone not null,
  proposed_end timestamp with time zone not null,
  location text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamp with time zone not null default now()
);

create index calendar_events_user_time_idx
  on public.calendar_events (user_id, start_time, end_time);

create index daily_check_ins_user_created_idx
  on public.daily_check_ins (user_id, created_at desc);

create index activity_recommendations_user_created_idx
  on public.activity_recommendations (user_id, created_at desc);

create index activity_history_user_completed_idx
  on public.activity_history (user_id, completed_at desc);

create index friendships_user_id_idx on public.friendships (user_id, status);
create index friendships_friend_id_idx on public.friendships (friend_id, status);

create index activity_invitations_receiver_idx
  on public.activity_invitations (receiver_id, status);
