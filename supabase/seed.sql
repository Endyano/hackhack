-- CareShift demo seed data -- minimal, unambiguous scenario. Safe to re-run
-- as many times as you want: deletes existing rows for these users first
-- (by fixed id AND by every username this seed has ever used, so stale rows
-- from earlier iterations of this file or from backend/seed/seed_data.py
-- never collide), then re-inserts a fresh copy dated relative to
-- CURRENT_DATE.
--
-- Nova:  11111111-1111-1111-1111-111111111111 (primary test account)
-- Kai:   22222222-2222-2222-2222-222222222222 (already-accepted friend --
--        each has exactly ONE free slot today, and they overlap 16:45-17:45,
--        so this is the only possible CareMatch match: unambiguous)
-- Zara:  33333333-3333-3333-3333-333333333333 (has sent Nova a pending
--        friend request -- not yet accepted, nothing else set up for her)
--
-- carematch_enabled is true for every user and every friendship row here on
-- purpose (per request, the enable/disable toggle isn't part of this test).

delete from users
where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
)
or username in ('nova', 'kai', 'zara', 'eric', 'daniel', 'merry', 'rudy', 'maya', 'sam', 'priya');

-- ============================================================
-- USERS
-- ============================================================
insert into users (id, username, name, email, experience_level, primary_goal, current_location, carematch_enabled) values
  ('11111111-1111-1111-1111-111111111111', 'nova', 'Nova', 'nova@careshift.demo', 'beginner', 'improve endurance', 'campus', true),
  ('22222222-2222-2222-2222-222222222222', 'kai', 'Kai', 'kai@careshift.demo', 'intermediate', 'stay active', 'campus', true),
  ('33333333-3333-3333-3333-333333333333', 'zara', 'Zara', 'zara@careshift.demo', 'beginner', 'build a routine', 'library', true);

-- ============================================================
-- USER_PREFERENCES
-- ============================================================
insert into user_preferences (user_id, preferred_activities, disliked_activities, friend_match_pref) values
  ('11111111-1111-1111-1111-111111111111', array['running', 'stretching'], array['swimming'], 'running partner'),
  ('22222222-2222-2222-2222-222222222222', array['running', 'basketball'], array[]::text[], 'running partner'),
  ('33333333-3333-3333-3333-333333333333', array['walking', 'meditation'], array[]::text[], 'study break partner');

-- ============================================================
-- CALENDAR_EVENTS (today) -- each of Nova/Kai has exactly ONE busy-free gap
-- today so there is exactly one possible overlap, with no bigger competing
-- free block anywhere else in the day to cause confusion:
--   Nova: busy 07:00-16:00 and 18:45-23:00 -> free 16:00-18:45
--   Kai:  busy 07:00-16:45 and 17:45-23:00 -> free 16:45-17:45
--   Overlap: 16:45-17:45 (60 min)
-- ============================================================
insert into calendar_events (user_id, title, start_time, end_time, event_type) values
  ('11111111-1111-1111-1111-111111111111', 'Class + errands', CURRENT_DATE + time '07:00', CURRENT_DATE + time '15:45', 'class'),
  ('11111111-1111-1111-1111-111111111111', 'Dinner', CURRENT_DATE + time '19:00', CURRENT_DATE + time '23:00', 'personal'),
  ('22222222-2222-2222-2222-222222222222', 'Class', CURRENT_DATE + time '07:00', CURRENT_DATE + time '16:30', 'class'),
  ('22222222-2222-2222-2222-222222222222', 'Dinner', CURRENT_DATE + time '18:00', CURRENT_DATE + time '23:00', 'personal');

-- ============================================================
-- DAILY_CHECK_INS
-- ============================================================
insert into daily_check_ins (user_id, mood, energy_level, physical_readiness, location, additional_notes) values
  ('11111111-1111-1111-1111-111111111111', 'stressed', 'medium', 'normal', 'campus', 'Do not want to sweat before class.'),
  ('22222222-2222-2222-2222-222222222222', 'calm', 'high', 'good', 'campus', null);

-- ============================================================
-- ACTIVITY_RECOMMENDATIONS -- gives each of Nova/Kai a "latest recommendation"
-- so /carematch/{user}/matches has a suggested_activity to show.
-- ============================================================
insert into activity_recommendations (user_id, activity_name, category, start_time, duration_minutes, intensity, reason, status) values
  ('11111111-1111-1111-1111-111111111111', 'Easy run', 'physical', CURRENT_DATE + time '16:00', 60, 'easy', 'Seed data for demo', 'pending'),
  ('22222222-2222-2222-2222-222222222222', 'Easy run', 'physical', CURRENT_DATE + time '16:45', 60, 'easy', 'Seed data for demo', 'pending');

-- ============================================================
-- FRIENDSHIPS
-- Nova<->Kai: accepted, CareMatch on for both sides -> the overlap above
-- Zara->Nova: pending -- an incoming request for Nova to accept/decline
-- ============================================================
insert into friendships (user_id, friend_id, status, carematch_enabled) values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'accepted', true),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'pending', true);

-- Quick sanity check after seeding, e.g. in the Supabase SQL editor:
-- select username, name, carematch_enabled from public.users order by username;
