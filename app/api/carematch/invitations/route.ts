import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '../../../../lib/supabase/server';
import { resolveCareShiftProfile } from '../../../../lib/supabase/profile';

function getAccessToken(request: NextRequest) {
  const value = request.headers.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}

async function authenticate(request: NextRequest) {
  const token = getAccessToken(request);
  if (!token) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const authClient = createSupabaseServerClient(token);
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return { error: NextResponse.json({ error: 'Invalid session.' }, { status: 401 }) };
  const supabase = createSupabaseServiceClient();
  const profile = await resolveCareShiftProfile(supabase, data.user);
  return { supabase, userId: profile.id };
}

export async function GET(request: NextRequest) {
  try {
    const result = await authenticate(request);
    if ('error' in result) return result.error;
    const { data, error } = await result.supabase.from('activity_invitations').select('*').eq('receiver_id', result.userId).eq('status', 'pending').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const senderIds = (data ?? []).map((invite) => invite.sender_id);
    const { data: senders } = senderIds.length ? await result.supabase.from('users').select('id, name').in('id', senderIds) : { data: [] };
    const names = new Map((senders ?? []).map((sender) => [sender.id, sender.name]));
    return NextResponse.json((data ?? []).map((invite) => ({ id: invite.id, senderName: names.get(invite.sender_id) ?? 'A friend', activity: invite.activity_name, proposedStart: invite.proposed_start, proposedEnd: invite.proposed_end })));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load invitations.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await authenticate(request);
    if ('error' in result) return result.error;
    const body = await request.json().catch(() => null) as { receiverId?: unknown; activityName?: unknown; proposedStart?: unknown; proposedEnd?: unknown } | null;
    if (!body || typeof body.receiverId !== 'string' || typeof body.activityName !== 'string' || typeof body.proposedStart !== 'string' || typeof body.proposedEnd !== 'string' || Number.isNaN(Date.parse(body.proposedStart)) || Number.isNaN(Date.parse(body.proposedEnd))) return NextResponse.json({ error: 'Valid invitation details are required.' }, { status: 400 });
    const { data: friendship, error: friendshipError } = await result.supabase.from('friendships').select('id').in('status', ['pending', 'accepted']).or(`and(user_id.eq.${result.userId},friend_id.eq.${body.receiverId}),and(user_id.eq.${body.receiverId},friend_id.eq.${result.userId})`).maybeSingle();
    if (friendshipError) return NextResponse.json({ error: friendshipError.message }, { status: 500 });
    if (!friendship) return NextResponse.json({ error: 'Send a friend request before inviting this person.' }, { status: 403 });
    const { error } = await result.supabase.from('activity_invitations').insert({ sender_id: result.userId, receiver_id: body.receiverId, activity_name: body.activityName.trim() || 'Training session', proposed_start: body.proposedStart, proposed_end: body.proposedEnd });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to send invitation.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const result = await authenticate(request);
    if ('error' in result) return result.error;
    const body = await request.json().catch(() => null) as { id?: unknown; status?: unknown } | null;
    if (!body || typeof body.id !== 'string' || (body.status !== 'accepted' && body.status !== 'declined')) return NextResponse.json({ error: 'A valid invitation response is required.' }, { status: 400 });
    const { error } = await result.supabase.from('activity_invitations').update({ status: body.status }).eq('id', body.id).eq('receiver_id', result.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update invitation.' }, { status: 500 });
  }
}
