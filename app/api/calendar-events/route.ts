import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '../../../lib/supabase/server';
import { resolveCareShiftProfile } from '../../../lib/supabase/profile';

type CalendarEventPayload = {
  title?: unknown;
  startAt?: unknown;
  endAt?: unknown;
  type?: unknown;
  note?: unknown;
};

const eventTypes = new Set(['training', 'mobility', 'recovery', 'social']);

function getAccessToken(request: NextRequest) {
  const value = request.headers.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}

async function getAuthenticatedClient(request: NextRequest) {
  const token = getAccessToken(request);
  if (!token) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };

  try {
    const authClient = createSupabaseServerClient(token);
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data.user) return { error: NextResponse.json({ error: 'Invalid session.' }, { status: 401 }) };
    const supabase = createSupabaseServiceClient();
    const profile = await resolveCareShiftProfile(supabase, data.user);
    return { supabase, userId: profile.id };
  } catch (error) {
    return { error: NextResponse.json({ error: error instanceof Error ? error.message : 'Supabase configuration failed.' }, { status: 500 }) };
  }
}

export async function GET(request: NextRequest) {
  const result = await getAuthenticatedClient(request);
  if ('error' in result) return result.error;

  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');
  let query = result.supabase.from('calendar_events').select('*').eq('user_id', result.userId).order('start_time', { ascending: true });
  if (from) query = query.gte('start_time', from);
  if (to) query = query.lte('end_time', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data.map((event) => ({
    id: event.id,
    title: event.title,
    startAt: event.start_time,
    endAt: event.end_time,
    type: event.event_type,
  })));
}

export async function POST(request: NextRequest) {
  const result = await getAuthenticatedClient(request);
  if ('error' in result) return result.error;

  const body = await request.json().catch(() => null) as CalendarEventPayload | null;
  if (!body || typeof body.title !== 'string' || typeof body.startAt !== 'string' || typeof body.endAt !== 'string' || typeof body.type !== 'string') {
    return NextResponse.json({ error: 'title, startAt, endAt, and type are required.' }, { status: 400 });
  }
  if (!body.title.trim() || !eventTypes.has(body.type) || Number.isNaN(Date.parse(body.startAt)) || Number.isNaN(Date.parse(body.endAt)) || Date.parse(body.endAt) <= Date.parse(body.startAt)) {
    return NextResponse.json({ error: 'The calendar event data is invalid.' }, { status: 400 });
  }

  const { data, error } = await result.supabase
    .from('calendar_events')
    .insert({ user_id: result.userId, title: body.title.trim(), start_time: body.startAt, end_time: body.endAt, event_type: body.type })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, title: data.title, startAt: data.start_time, endAt: data.end_time, type: data.event_type }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const result = await getAuthenticatedClient(request);
  if ('error' in result) return result.error;

  const { error } = await result.supabase.from('calendar_events').delete().eq('user_id', result.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
