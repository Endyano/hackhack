import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createSupabaseServerClient(accessToken: string) {
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.');
  }

  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

// Used only inside route handlers, after they have verified the caller's JWT.
// This key is never prefixed with NEXT_PUBLIC and is never sent to the browser.
export function createSupabaseServiceClient() {
  if (!url || !serviceRoleKey) {
    throw new Error('Server-side Supabase access is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local.');
  }

  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
