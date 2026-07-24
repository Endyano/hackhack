-- Run this once in the Supabase SQL editor -- the `username` field was added
-- to the app code but the live database was never migrated for it.
alter table public.users add column if not exists username text;
update public.users set username = lower(name) where username is null;
alter table public.users alter column username set not null;
alter table public.users add constraint users_username_key unique (username);
