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

    const { data: links, error } = await result.supabase
      .from('friendships')
      .select('id, user_id, friend_id, status')
      .or(`user_id.eq.${result.userId},friend_id.eq.${result.userId}`)
      .in('status', ['pending', 'accepted']);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const peerIds = (links ?? []).map((link) => link.user_id === result.userId ? link.friend_id : link.user_id);
    const { data: users, error: usersError } = peerIds.length
      ? await result.supabase.from('users').select('id, name, email').in('id', peerIds)
      : { data: [], error: null };
    if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

    const usersById = new Map((users ?? []).map((user) => [user.id, user]));
    return NextResponse.json((links ?? []).flatMap((link) => {
      const peerId = link.user_id === result.userId ? link.friend_id : link.user_id;
      const user = usersById.get(peerId);
      return user ? [{ id: link.id, friendId: user.id, name: user.name, email: user.email, status: link.status, incoming: link.friend_id === result.userId }] : [];
    }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load friends.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await authenticate(request);
    if ('error' in result) return result.error;
    const body = await request.json().catch(() => null) as { email?: unknown } | null;
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) return NextResponse.json({ error: 'Enter your friend’s email address.' }, { status: 400 });

    const { data: friend, error: friendError } = await result.supabase.from('users').select('id, name, email').eq('email', email).maybeSingle();
    if (friendError) return NextResponse.json({ error: friendError.message }, { status: 500 });
    if (!friend) return NextResponse.json({ error: 'No CareShift profile found for that email. Ask them to sign in once first.' }, { status: 404 });
    if (friend.id === result.userId) return NextResponse.json({ error: 'You cannot add yourself.' }, { status: 400 });

    const { data: existing, error: existingError } = await result.supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${result.userId},friend_id.eq.${friend.id}),and(user_id.eq.${friend.id},friend_id.eq.${result.userId})`)
      .maybeSingle();
    if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
    if (existing) return NextResponse.json({ error: 'A friend request already exists for this person.' }, { status: 409 });

    const { data, error } = await result.supabase
      .from('friendships')
      .insert({ user_id: result.userId, friend_id: friend.id, status: 'pending' })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id, friendId: friend.id, name: friend.name, email: friend.email, status: 'pending', incoming: false }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to send friend request.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const result = await authenticate(request);
    if ('error' in result) return result.error;
    const body = await request.json().catch(() => null) as { id?: unknown; status?: unknown } | null;
    if (!body || typeof body.id !== 'string' || (body.status !== 'accepted' && body.status !== 'declined')) return NextResponse.json({ error: 'A valid friend request response is required.' }, { status: 400 });
    const { error } = await result.supabase.from('friendships').update({ status: body.status }).eq('id', body.id).eq('friend_id', result.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update friend request.' }, { status: 500 });
  }
}
