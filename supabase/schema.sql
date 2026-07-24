-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  experience_level text,
  primary_goal text,
  current_location text,
  carematch_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  preferred_activities ARRAY NOT NULL DEFAULT '{}'::text[],
  disliked_activities ARRAY NOT NULL DEFAULT '{}'::text[],
  friend_match_pref text,
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id)
);
CREATE TABLE public.calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  event_type text,
  CONSTRAINT calendar_events_pkey PRIMARY KEY (id),
  CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.daily_check_ins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mood text,
  energy_level text,
  physical_readiness text,
  location text,
  additional_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT daily_check_ins_pkey PRIMARY KEY (id)
);
CREATE TABLE public.activity_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_name text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['mental'::text, 'physical'::text, 'nutritional'::text])),
  start_time timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  intensity text,
  reason text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'replaced'::text, 'shortened'::text, 'skipped'::text, 'completed'::text, 'partially_completed'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT activity_recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT activity_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.activity_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recommendation_id uuid,
  completion_status text,
  feedback text,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT activity_history_pkey PRIMARY KEY (id),
  CONSTRAINT activity_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT activity_history_recommendation_id_fkey FOREIGN KEY (recommendation_id) REFERENCES public.activity_recommendations(id)
);
CREATE TABLE public.friendships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])),
  carematch_enabled boolean NOT NULL DEFAULT true,
  CONSTRAINT friendships_pkey PRIMARY KEY (id),
  CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT friendships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.users(id)
);
CREATE TABLE public.activity_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  recommendation_id uuid,
  activity_name text NOT NULL,
  proposed_start timestamp with time zone NOT NULL,
  proposed_end timestamp with time zone NOT NULL,
  location text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'cancelled'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT activity_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT activity_invitations_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT activity_invitations_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id),
  CONSTRAINT activity_invitations_recommendation_id_fkey FOREIGN KEY (recommendation_id) REFERENCES public.activity_recommendations(id)
);