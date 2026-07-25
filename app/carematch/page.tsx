'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import PageShell from '../Components/PageShell';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import { getFriends, getInvitations, requestFriend, respondToFriendRequest, respondToInvitation, sendInvitation, type CareMatchFriend, type CareMatchInvitation } from '../../lib/carematch';

const accentLime = '#D4FF3E';
const bgDark = '#090C0B';

function nextTrainingWindow() {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatWindow(value: string) {
  return new Date(value).toLocaleString('en-GB', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function CareMatchPage() {
  const [token, setToken] = useState<string | null>(null);
  const [friends, setFriends] = useState<CareMatchFriend[]>([]);
  const [invitations, setInvitations] = useState<CareMatchInvitation[]>([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCareMatch = useCallback(async (accessToken: string) => {
    const [nextFriends, nextInvitations] = await Promise.all([getFriends(accessToken), getInvitations(accessToken)]);
    setFriends(nextFriends);
    setInvitations(nextInvitations);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.resolve();
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setMessage('Please sign in to use CareMatch.');
          setIsLoading(false);
          return;
        }
        setToken(data.session.access_token);
        try {
          await loadCareMatch(data.session.access_token);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Unable to load CareMatch.');
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Supabase is not configured.');
        setIsLoading(false);
      }
    };
    void load();
  }, [loadCareMatch]);

  const inviteableFriends = useMemo(() => friends.filter((friend) => !friend.incoming || friend.status === 'accepted'), [friends]);
  const incomingRequests = useMemo(() => friends.filter((friend) => friend.status === 'pending' && friend.incoming), [friends]);
  const sentRequests = useMemo(() => friends.filter((friend) => friend.status === 'pending' && !friend.incoming), [friends]);

  const refresh = async () => {
    if (!token) return;
    await loadCareMatch(token);
  };

  const handleAddFriend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !friendEmail.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setMessage('');
    try {
      await requestFriend(token, friendEmail.trim());
      setFriendEmail('');
      setMessage('Friend request sent. Use the Invite to run together button below to send them a workout invite now.');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send friend request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFriendResponse = async (friendshipId: string, status: 'accepted' | 'declined') => {
    if (!token) return;
    try {
      await respondToFriendRequest(token, friendshipId, status);
      setMessage(status === 'accepted' ? 'Training partner connected.' : 'Friend request declined.');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update friend request.');
    }
  };

  const handleInvite = async (friend: CareMatchFriend) => {
    if (!token) return;
    const window = nextTrainingWindow();
    try {
      await sendInvitation(token, friend.friendId, window.start, window.end);
      setMessage(`Training invitation sent to ${friend.name} for ${formatWindow(window.start)}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send training invitation.');
    }
  };

  const handleInvitationResponse = async (id: string, status: 'accepted' | 'declined') => {
    if (!token) return;
    try {
      await respondToInvitation(token, id, status);
      setMessage(status === 'accepted' ? 'Training invitation accepted.' : 'Training invitation declined.');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update invitation.');
    }
  };

  const panel = { padding: '26px', borderRadius: '28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' };
  const button = { padding: '11px 18px', borderRadius: '100px', border: 'none', background: accentLime, color: bgDark, fontWeight: 800, cursor: 'pointer' };

  return (
    <PageShell eyebrow="Feature · CareMatch" title="Training Partners" description="Add real CareShift members, connect after they accept, and send a training invitation." backgroundImage="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1920&q=80">
      {message && <p style={{ margin: 0, color: '#d9f99d', fontWeight: 700 }}>{message}</p>}

      <section style={panel}>
        <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Add a real member</p>
        <h3 style={{ margin: '8px 0 0', fontSize: '1.2rem', fontWeight: 800 }}>Send a friend request by email</h3>
        <form onSubmit={handleAddFriend} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '18px' }}>
          <input type="email" value={friendEmail} onChange={(event) => setFriendEmail(event.target.value)} placeholder="Friend’s CareShift email" required aria-label="Friend’s CareShift email" style={{ flex: '1 1 240px', minWidth: 0, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: 'white', padding: '12px 14px', outline: 'none' }} />
          <button type="submit" disabled={!friendEmail.trim() || isSubmitting} style={{ ...button, opacity: !friendEmail.trim() || isSubmitting ? 0.5 : 1 }}>{isSubmitting ? 'Sending…' : 'Send request'}</button>
        </form>
      </section>

      {incomingRequests.length > 0 && <section style={panel}>
        <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Friend requests</p>
        {incomingRequests.map((friend) => <div key={friend.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '14px', alignItems: 'center', marginTop: '16px' }}><span><strong>{friend.name}</strong> wants to connect.</span><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => handleFriendResponse(friend.id, 'accepted')} style={button}>Accept</button><button onClick={() => handleFriendResponse(friend.id, 'declined')} style={{ ...button, background: 'transparent', border: '1px solid rgba(255,255,255,0.22)', color: 'white' }}>Decline</button></div></div>)}
      </section>}

      {invitations.length > 0 && <section style={{ ...panel, border: '1px solid rgba(212,255,62,0.4)' }}>
        <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Training invitations</p>
        {invitations.map((invite) => <div key={invite.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '14px', alignItems: 'center', marginTop: '16px' }}><span><strong>{invite.senderName}</strong> invited you to {invite.activity.toLowerCase()} · {formatWindow(invite.proposedStart)}</span><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => handleInvitationResponse(invite.id, 'accepted')} style={button}>Accept</button><button onClick={() => handleInvitationResponse(invite.id, 'declined')} style={{ ...button, background: 'transparent', border: '1px solid rgba(255,255,255,0.22)', color: 'white' }}>Decline</button></div></div>)}
      </section>}

      <section style={{ ...panel, background: 'linear-gradient(180deg, rgba(212,255,62,0.06), rgba(15,23,42,0.95))', border: '1px solid rgba(212,255,62,0.2)' }}>
        <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Run together</p>
        <h3 style={{ margin: '10px 0 6px', fontSize: '1.25rem', fontWeight: 800 }}>Invite a friend to run together</h3>
        <p style={{ margin: 0, color: '#cbd5e1', fontSize: '14px' }}>Send a 30-minute easy-run invitation. Your friend can accept or decline it in CareMatch.</p>
        {isLoading ? <p style={{ color: '#cbd5e1' }}>Loading CareMatch…</p> : inviteableFriends.length ? <div style={{ display: 'grid', gap: '12px', marginTop: '18px' }}>{inviteableFriends.map((friend) => <div key={friend.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '18px', borderRadius: '18px', background: 'rgba(9,12,11,0.52)', border: '1px solid rgba(255,255,255,0.09)' }}><div><p style={{ margin: 0, fontWeight: 800 }}>{friend.name}</p><p style={{ margin: '5px 0 0', color: '#cbd5e1', fontSize: '14px' }}>{friend.status === 'accepted' ? 'Connected training partner' : 'Friend request pending'} · {friend.email}</p></div><button onClick={() => handleInvite(friend)} style={button}>Invite to run together</button></div>)}</div> : <p style={{ margin: '18px 0 0', color: '#cbd5e1' }}>Add a friend by email above, then the invite button will appear here.</p>}
        {sentRequests.length > 0 && <p style={{ margin: '18px 0 0', color: '#cbd5e1', fontSize: '14px' }}>Friend requests awaiting acceptance: {sentRequests.map((friend) => friend.name).join(', ')}</p>}
      </section>
    </PageShell>
  );
}
