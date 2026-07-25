'use client';

import { useMemo, useState, type FormEvent } from 'react';
import PageShell from '../Components/PageShell';
import type { CareMatchFriend, FreeSlot } from '../Components/DemoData';
import { useDemoState } from '../Components/DemoStateContext';

const bgDark = '#090C0B';
const accentLime = '#D4FF3E';

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getOverlap(ownSlots: FreeSlot[], friendSlots: FreeSlot[]) {
  for (const ownSlot of ownSlots) {
    for (const friendSlot of friendSlots) {
      const start = Math.max(toMinutes(ownSlot.start), toMinutes(friendSlot.start));
      const end = Math.min(toMinutes(ownSlot.end), toMinutes(friendSlot.end));
      if (start < end) {
        return {
          start: `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`,
          end: `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`,
        };
      }
    }
  }
  return null;
}

export default function CareMatchPage() {
  const {
    currentUser,
    friends,
    careMatchInvites,
    addFriend,
    sendCareMatchInvite,
    respondToCareMatchInvite,
  } = useDemoState();
  const [friendName, setFriendName] = useState('');

  const availableFriends = useMemo(
    () => friends.flatMap((friend) => {
      const overlap = getOverlap(currentUser.freeSlots, friend.freeSlots);
      return overlap ? [{ friend, overlap }] : [];
    }),
    [currentUser.freeSlots, friends],
  );
  const incomingInvites = careMatchInvites.filter((invite) => invite.toId === currentUser.id && invite.status === 'pending');
  const sentInvites = careMatchInvites.filter((invite) => invite.fromId === currentUser.id);

  const handleAddFriend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addFriend(friendName);
    setFriendName('');
  };

  const inviteFriend = (friend: CareMatchFriend, start: string, end: string) => {
    sendCareMatchInvite(friend, 'Easy run together', start, end);
  };

  return (
    <PageShell
      eyebrow="Feature · CareMatch"
      title="Training Partners"
      description="Sync with training partners, find shared free time, and plan a session together."
      backgroundImage="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1920&q=80"
    >
      {incomingInvites.length > 0 && (
        <section style={{ padding: '24px', borderRadius: '28px', background: 'rgba(212, 255, 62, 0.1)', border: '1px solid rgba(212, 255, 62, 0.45)' }}>
          <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            CareMatch Notifications · {incomingInvites.length} new
          </p>
          {incomingInvites.map((invite) => (
            <div key={invite.id} style={{ marginTop: '14px', padding: '16px', borderRadius: '18px', background: 'rgba(9,12,11,0.5)' }}>
              <p style={{ margin: 0, fontWeight: 800 }}>{invite.fromName} invited you to {invite.activity.toLowerCase()}.</p>
              <p style={{ margin: '6px 0 14px', color: '#cbd5e1', fontSize: '14px' }}>Suggested time: {invite.start}–{invite.end}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button onClick={() => respondToCareMatchInvite(invite.id, 'accepted')} className="dash-btn" style={{ padding: '10px 18px', borderRadius: '100px', border: 'none', background: accentLime, color: bgDark, fontWeight: 800, cursor: 'pointer' }}>Accept</button>
                <button onClick={() => respondToCareMatchInvite(invite.id, 'declined')} className="dash-btn" style={{ padding: '10px 18px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#e2e8f0', fontWeight: 700, cursor: 'pointer' }}>Decline</button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section style={{ padding: '26px', borderRadius: '28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Training Partners</p>
            <h3 style={{ margin: '8px 0 0', fontSize: '1.2rem', fontWeight: 800 }}>Add a training partner to sync</h3>
          </div>
          <span style={{ color: '#cbd5e1', fontSize: '13px' }}>{friends.length} connected friends</span>
        </div>
        <form onSubmit={handleAddFriend} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '18px' }}>
          <input value={friendName} onChange={(event) => setFriendName(event.target.value)} placeholder="Friend’s name, e.g. Nadia" aria-label="Friend’s name" style={{ flex: '1 1 240px', minWidth: 0, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: 'white', padding: '12px 14px', outline: 'none' }} />
          <button type="submit" disabled={!friendName.trim()} className="dash-btn" style={{ padding: '12px 20px', borderRadius: '100px', border: 'none', background: friendName.trim() ? accentLime : 'rgba(212,255,62,0.25)', color: bgDark, fontWeight: 800, cursor: friendName.trim() ? 'pointer' : 'not-allowed' }}>+ Add friend</button>
        </form>
      </section>

      <section style={{ padding: '26px', borderRadius: '28px', background: 'linear-gradient(180deg, rgba(212, 255, 62, 0.06), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(212, 255, 62, 0.2)' }}>
        <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Synced calendars</p>
        <h3 style={{ margin: '10px 0 6px', fontSize: '1.25rem', fontWeight: 800 }}>Partners available for training</h3>
        <p style={{ margin: '0 0 18px', color: '#cbd5e1', lineHeight: 1.6 }}>CareMatch compares your training availability with connected partners’ calendars.</p>

        {availableFriends.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {availableFriends.map(({ friend, overlap }) => {
              const alreadySent = sentInvites.some((invite) => invite.toId === friend.id && invite.status === 'pending');
              return (
                <div key={friend.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '18px', borderRadius: '18px', background: 'rgba(9,12,11,0.52)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800 }}>{friend.name} is available</p>
                    <p style={{ margin: '5px 0 0', color: '#cbd5e1', fontSize: '14px' }}>Shared free time: {overlap.start}–{overlap.end}</p>
                  </div>
                  <button onClick={() => inviteFriend(friend, overlap.start, overlap.end)} disabled={alreadySent} className="dash-btn" style={{ padding: '11px 18px', borderRadius: '100px', border: 'none', background: alreadySent ? 'rgba(212,255,62,0.22)' : accentLime, color: bgDark, fontWeight: 800, cursor: alreadySent ? 'default' : 'pointer' }}>
                    {alreadySent ? 'Invitation sent' : 'Invite to train together'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#cbd5e1' }}>No friends share your free time yet. Add another friend to try again.</p>
        )}
      </section>
    </PageShell>
  );
}
