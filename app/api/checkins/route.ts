import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '../../../lib/supabase/server';
import { resolveCareShiftProfile } from '../../../lib/supabase/profile';

type CheckinPayload = {
  bodyStatus?: unknown;
  readiness?: unknown;
};

const bodyStatuses = new Set(['positive', 'neutral', 'negative']);

function getAccessToken(request: NextRequest) {
  const value = request.headers.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}

export async function POST(request: NextRequest) {
  const token = getAccessToken(request);
  if (!token) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  try {
    const authClient = createSupabaseServerClient(token);
    const { data: auth, error: authError } = await authClient.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
    const supabase = createSupabaseServiceClient();
    const profile = await resolveCareShiftProfile(supabase, auth.user);

    const body = await request.json().catch(() => null) as CheckinPayload | null;
    if (!body || typeof body.bodyStatus !== 'string' || typeof body.readiness !== 'number' || !bodyStatuses.has(body.bodyStatus) || !Number.isInteger(body.readiness) || body.readiness < 0 || body.readiness > 100) {
      return NextResponse.json({ error: 'A valid body status and readiness score are required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('daily_check_ins')
      .insert({
        user_id: profile.id,
        mood: body.bodyStatus,
        energy_level: `${body.readiness}%`,
        physical_readiness: body.readiness <= 20 ? 'low' : body.readiness <= 80 ? 'moderate' : 'high',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ id: data.id, bodyStatus: data.mood, readiness: body.readiness, createdAt: data.created_at });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Supabase configuration failed.' }, { status: 500 });
  }
}
