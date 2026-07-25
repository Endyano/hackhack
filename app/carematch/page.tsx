'use client';

import { useState, type FormEvent } from 'react';
import PageShell from '../Components/PageShell';
import { useDemoState } from '../Components/DemoStateContext';
import { formatLocalTime, type CareMatchMatch } from '@/lib/api';

const bgDark = '#090C0B';
const accentLime = '#D4FF3E';
const textGray = '#9CA3AF';

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: '52px',
        height: '30px',
        borderRadius: '100px',
        border: 'none',
        background: checked ? accentLime : 'rgba(255,255,255,0.18)',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background 0.2s ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '25px' : '3px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: checked ? bgDark : '#e2e8f0',
          transition: 'left 0.2s ease',
        }}
      />
    </button>
  );
}

export default function CareMatchPage() {
  const {
    backendUserId,
    connectedFriends,
    careMatchMatches,
    careMatchMatchesLoading,
    careMatchInvitations,
    friendRequests,
    careMatchEnabled,
    careMatchLoading,
    sendFriendRequestByUsername,
    respondToFriendRequest,
    sendCareMatchInvite,
    respondToCareMatchInvite,
    toggleCareMatchEnabled,
  } = useDemoState();

  const [friendUsername, setFriendUsername] = useState('');
  const [addFriendError, setAddFriendError] = useState<string | null>(null);
  const [addFriendBusy, setAddFriendBusy] = useState(false);
  const [inviteBusyId, setInviteBusyId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const incomingInvites = careMatchInvitations.incoming.filter((invite) => invite.status === 'pending');
  const sentInvites = careMatchInvitations.outgoing;

  const handleAddFriend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = friendUsername.trim();
    if (!username) return;
    setAddFriendBusy(true);
    setAddFriendError(null);
    const result = await sendFriendRequestByUsername(username);
    setAddFriendBusy(false);
    if (result.ok) {
      setFriendUsername('');
    } else {
      setAddFriendError(result.error ?? 'Could not send friend request.');
    }
  };

  const inviteFriend = async (match: CareMatchMatch) => {
    setInviteBusyId(match.friend_id);
    setInviteError(null);
    const result = await sendCareMatchInvite(match);
    setInviteBusyId(null);
    if (!result.ok) {
      setInviteError(result.error ?? 'Could not send invitation.');
    }
  };

  if (!backendUserId) {
    return (
      <PageShell
        eyebrow="Feature · CareMatch"
        title="CareMatch"
        description="Sync with friends, find matching free time, then invite them to move together."
        backgroundImage="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1920&q=80"
      >
        <p style={{ margin: 0, color: textGray }}>Connecting to the CareShift server...</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Feature · CareMatch"
      title="CareMatch"
      description="Sync with friends, find matching free time, then invite them to move together."
      backgroundImage="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1920&q=80"
    >
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          padding: '22px 26px',
          borderRadius: '24px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>CareMatch</p>
          <p style={{ margin: '4px 0 0', color: textGray, fontSize: '13px' }}>
            {careMatchEnabled ? 'On -- friends can invite you and be invited via CareMatch.' : "Off -- you won't show up or receive CareMatch invitations."}
          </p>
        </div>
        <ToggleSwitch checked={careMatchEnabled} onChange={toggleCareMatchEnabled} disabled={careMatchLoading} />
      </section>

      {!careMatchEnabled && (
        <p style={{ margin: 0, color: textGray, fontSize: '14px' }}>
          CareMatch is currently off. Turn the toggle above back on to add friends and see shared free time.
        </p>
      )}

      {careMatchEnabled && (
        <>
          {(incomingInvites.length > 0 || friendRequests.incoming.length > 0) && (
            <section style={{ padding: '24px', borderRadius: '28px', background: 'rgba(212, 255, 62, 0.1)', border: '1px solid rgba(212, 255, 62, 0.45)' }}>
              <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                CareMatch Notifications · {incomingInvites.length + friendRequests.incoming.length} new
              </p>

              {friendRequests.incoming.map((req) => (
                <div key={req.friendship_id} style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '18px', background: 'rgba(9,12,11,0.5)' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800 }}>{req.name} wants to be friends with you.</p>
                    <p style={{ margin: '4px 0 0', color: '#cbd5e1', fontSize: '13px' }}>@{req.username}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button disabled={careMatchLoading} onClick={() => respondToFriendRequest(req.friendship_id, 'accept')} className="dash-btn" style={{ padding: '10px 18px', borderRadius: '100px', border: 'none', background: accentLime, color: bgDark, fontWeight: 800, cursor: careMatchLoading ? 'not-allowed' : 'pointer' }}>Accept</button>
                    <button disabled={careMatchLoading} onClick={() => respondToFriendRequest(req.friendship_id, 'decline')} className="dash-btn" style={{ padding: '10px 18px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#e2e8f0', fontWeight: 700, cursor: careMatchLoading ? 'not-allowed' : 'pointer' }}>Decline</button>
                  </div>
                </div>
              ))}

              {incomingInvites.map((invite) => (
                <div key={invite.id} style={{ marginTop: '14px', padding: '16px', borderRadius: '18px', background: 'rgba(9,12,11,0.5)' }}>
                  <p style={{ margin: 0, fontWeight: 800 }}>{invite.sender_name} invited you to {invite.activity_name.toLowerCase()}.</p>
                  <p style={{ margin: '6px 0 14px', color: '#cbd5e1', fontSize: '14px' }}>Matching time: {formatLocalTime(invite.proposed_start)}–{formatLocalTime(invite.proposed_end)}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <button onClick={() => respondToCareMatchInvite(invite.id, 'accept')} className="dash-btn" style={{ padding: '10px 18px', borderRadius: '100px', border: 'none', background: accentLime, color: bgDark, fontWeight: 800, cursor: 'pointer' }}>Accept</button>
                    <button onClick={() => respondToCareMatchInvite(invite.id, 'decline')} className="dash-btn" style={{ padding: '10px 18px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#e2e8f0', fontWeight: 700, cursor: 'pointer' }}>Decline</button>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section style={{ padding: '26px', borderRadius: '28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>CareMatch Friends</p>
                <h3 style={{ margin: '8px 0 0', fontSize: '1.2rem', fontWeight: 800 }}>Add a friend by username</h3>
              </div>
              <span style={{ color: '#cbd5e1', fontSize: '13px' }}>{connectedFriends.length} connected friends</span>
            </div>
            <form onSubmit={handleAddFriend} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '18px' }}>
              <input
                value={friendUsername}
                onChange={(event) => { setFriendUsername(event.target.value); setAddFriendError(null); }}
                placeholder="Friend's username, e.g. maya"
                aria-label="Friend's username"
                style={{ flex: '1 1 240px', minWidth: 0, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: 'white', padding: '12px 14px', outline: 'none' }}
              />
              <button
                type="submit"
                disabled={!friendUsername.trim() || addFriendBusy}
                className="dash-btn"
                style={{ padding: '12px 20px', borderRadius: '100px', border: 'none', background: friendUsername.trim() && !addFriendBusy ? accentLime : 'rgba(212,255,62,0.25)', color: bgDark, fontWeight: 800, cursor: friendUsername.trim() && !addFriendBusy ? 'pointer' : 'not-allowed' }}
              >
                {addFriendBusy ? 'Sending...' : '+ Send request'}
              </button>
            </form>
            {addFriendError && <p style={{ margin: '10px 0 0', color: '#fca5a5', fontSize: '13px' }}>{addFriendError}</p>}

            {friendRequests.outgoing.length > 0 && (
              <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
                {friendRequests.outgoing.map((req) => (
                  <p key={req.friendship_id} style={{ margin: 0, color: textGray, fontSize: '13px' }}>
                    Waiting for <strong style={{ color: '#e2e8f0' }}>@{req.username}</strong> to accept your request.
                  </p>
                ))}
              </div>
            )}

            {connectedFriends.length > 0 && (
              <div style={{ marginTop: '18px', display: 'grid', gap: '8px' }}>
                {connectedFriends.map((friend) => (
                  <div key={friend.friendship_id} style={{ padding: '12px 16px', borderRadius: '14px', background: 'rgba(9,12,11,0.4)', fontSize: '14px', fontWeight: 700 }}>
                    {friend.name} <span style={{ color: textGray, fontWeight: 500 }}>@{friend.username}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={{ padding: '26px', borderRadius: '28px', background: 'linear-gradient(180deg, rgba(212, 255, 62, 0.06), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(212, 255, 62, 0.2)' }}>
            <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Synced Calendar</p>
            <h3 style={{ margin: '10px 0 6px', fontSize: '1.25rem', fontWeight: 800 }}>Friends available when you're free</h3>
            <p style={{ margin: '0 0 18px', color: '#cbd5e1', lineHeight: 1.6 }}>CareMatch compares your free time blocks against connected friends' calendars.</p>

            {inviteError && <p style={{ margin: '0 0 14px', color: '#fca5a5', fontSize: '13px' }}>{inviteError}</p>}

            {careMatchMatchesLoading ? (
              <p style={{ margin: 0, color: '#cbd5e1' }}>Loading shared free time...</p>
            ) : careMatchMatches.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {careMatchMatches.map((match) => {
                  const alreadySent = sentInvites.some(
                    (invite) => invite.receiver_id === match.friend_id && invite.status === 'pending',
                  );
                  const busy = inviteBusyId === match.friend_id;
                  return (
                    <div key={match.friend_id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '18px', borderRadius: '18px', background: 'rgba(9,12,11,0.52)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 800 }}>{match.name} is available</p>
                        <p style={{ margin: '5px 0 0', color: '#cbd5e1', fontSize: '14px' }}>
                          Shared free time: {formatLocalTime(match.overlap_start)}–{formatLocalTime(match.overlap_end)}
                          {match.suggested_activity ? ` · ${match.suggested_activity}` : ''}
                        </p>
                      </div>
                      <button onClick={() => inviteFriend(match)} disabled={alreadySent || busy} className="dash-btn" style={{ padding: '11px 18px', borderRadius: '100px', border: 'none', background: alreadySent ? 'rgba(212,255,62,0.22)' : accentLime, color: bgDark, fontWeight: 800, cursor: alreadySent || busy ? 'default' : 'pointer' }}>
                        {alreadySent ? 'Invitation sent' : busy ? 'Sending...' : `Invite to ${match.suggested_activity ? match.suggested_activity.toLowerCase() : 'an activity'} together`}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ margin: 0, color: '#cbd5e1' }}>No friends with matching free time yet. Add another friend to try again.</p>
            )}
          </section>
        </>
      )}
    </PageShell>
  );
}
