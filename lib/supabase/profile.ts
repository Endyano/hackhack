import type { SupabaseClient, User } from '@supabase/supabase-js';

function makeUsername(email: string, authUserId: string) {
  const localPart = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'athlete';
  return `${localPart.slice(0, 24) || 'athlete'}_${authUserId.slice(0, 8)}`;
}

// The supplied schema gives public.users its own UUID. Always resolve the
// signed-in Auth user through email before using user_id in app tables.
export async function resolveCareShiftProfile(supabase: SupabaseClient, authUser: User) {
  if (!authUser.email) throw new Error('A valid email-based session is required.');
  const email = authUser.email.trim().toLowerCase();
  const { data: existing, error: lookupError } = await supabase
    .from('users')
    .select('id, username, name, email')
    .eq('email', email)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing;

  const name = typeof authUser.user_metadata.full_name === 'string' && authUser.user_metadata.full_name.trim()
    ? authUser.user_metadata.full_name.trim()
    : email.split('@')[0];
  const { data: created, error: createError } = await supabase
    .from('users')
    .insert({ username: makeUsername(email, authUser.id), name, email })
    .select('id, username, name, email')
    .single();
  if (createError) throw createError;
  return created;
}
