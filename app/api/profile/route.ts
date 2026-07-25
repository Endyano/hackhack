import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '../../../lib/supabase/server';
import { resolveCareShiftProfile } from '../../../lib/supabase/profile';

function getAccessToken(request: NextRequest) {
  const value = request.headers.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}

export async function POST(request: NextRequest) {
  const token = getAccessToken(request);
  if (!token) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  try {
    const authClient = createSupabaseServerClient(token);
    const { data, error: authError } = await authClient.auth.getUser(token);
    const user = data.user;
    if (authError || !user || !user.email) return NextResponse.json({ error: 'A valid email-based session is required.' }, { status: 401 });

    const profile = await resolveCareShiftProfile(createSupabaseServiceClient(), user);
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Supabase configuration failed.' }, { status: 500 });
  }
}
