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
        eyebrow="Fitur · CareMatch"
        title="CareMatch"
        description="Sinkronkan teman, temukan waktu luang yang sama, lalu ajak mereka bergerak bersama."
        backgroundImage="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1920&q=80"
      >
        <p style={{ margin: 0, color: textGray }}>Menghubungkan ke server CareShift...</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Fitur · CareMatch"
      title="CareMatch"
      description="Sinkronkan teman, temukan waktu luang yang sama, lalu ajak mereka bergerak bersama."
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
            {careMatchEnabled ? 'Aktif -- teman bisa mengajak dan diajak lewat CareMatch.' : 'Nonaktif -- kamu tidak akan muncul atau menerima ajakan CareMatch.'}
          </p>
        </div>
        <ToggleSwitch checked={careMatchEnabled} onChange={toggleCareMatchEnabled} disabled={careMatchLoading} />
      </section>

      {!careMatchEnabled && (
        <p style={{ margin: 0, color: textGray, fontSize: '14px' }}>
          Fitur CareMatch sedang nonaktif. Aktifkan kembali toggle di atas untuk menambah teman dan melihat waktu luang bersama.
        </p>
      )}

      {careMatchEnabled && (
        <>
          {(incomingInvites.length > 0 || friendRequests.incoming.length > 0) && (
            <section style={{ padding: '24px', borderRadius: '28px', background: 'rgba(212, 255, 62, 0.1)', border: '1px solid rgba(212, 255, 62, 0.45)' }}>
              <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Notifikasi CareMatch · {incomingInvites.length + friendRequests.incoming.length} baru
              </p>

              {friendRequests.incoming.map((req) => (
                <div key={req.friendship_id} style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '18px', background: 'rgba(9,12,11,0.5)' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800 }}>{req.name} ingin berteman denganmu.</p>
                    <p style={{ margin: '4px 0 0', color: '#cbd5e1', fontSize: '13px' }}>@{req.username}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button disabled={careMatchLoading} onClick={() => respondToFriendRequest(req.friendship_id, 'accept')} className="dash-btn" style={{ padding: '10px 18px', borderRadius: '100px', border: 'none', background: accentLime, color: bgDark, fontWeight: 800, cursor: careMatchLoading ? 'not-allowed' : 'pointer' }}>Terima</button>
                    <button disabled={careMatchLoading} onClick={() => respondToFriendRequest(req.friendship_id, 'decline')} className="dash-btn" style={{ padding: '10px 18px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#e2e8f0', fontWeight: 700, cursor: careMatchLoading ? 'not-allowed' : 'pointer' }}>Tolak</button>
                  </div>
                </div>
              ))}

              {incomingInvites.map((invite) => (
                <div key={invite.id} style={{ marginTop: '14px', padding: '16px', borderRadius: '18px', background: 'rgba(9,12,11,0.5)' }}>
                  <p style={{ margin: 0, fontWeight: 800 }}>{invite.sender_name} mengajakmu {invite.activity_name.toLowerCase()}.</p>
                  <p style={{ margin: '6px 0 14px', color: '#cbd5e1', fontSize: '14px' }}>Waktu yang cocok: {formatLocalTime(invite.proposed_start)}–{formatLocalTime(invite.proposed_end)}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <button onClick={() => respondToCareMatchInvite(invite.id, 'accept')} className="dash-btn" style={{ padding: '10px 18px', borderRadius: '100px', border: 'none', background: accentLime, color: bgDark, fontWeight: 800, cursor: 'pointer' }}>Terima</button>
                    <button onClick={() => respondToCareMatchInvite(invite.id, 'decline')} className="dash-btn" style={{ padding: '10px 18px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#e2e8f0', fontWeight: 700, cursor: 'pointer' }}>Tolak</button>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section style={{ padding: '26px', borderRadius: '28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Teman CareMatch</p>
                <h3 style={{ margin: '8px 0 0', fontSize: '1.2rem', fontWeight: 800 }}>Tambah teman lewat username</h3>
              </div>
              <span style={{ color: '#cbd5e1', fontSize: '13px' }}>{connectedFriends.length} teman tersambung</span>
            </div>
            <form onSubmit={handleAddFriend} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '18px' }}>
              <input
                value={friendUsername}
                onChange={(event) => { setFriendUsername(event.target.value); setAddFriendError(null); }}
                placeholder="Username teman, mis. maya"
                aria-label="Username teman"
                style={{ flex: '1 1 240px', minWidth: 0, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: 'white', padding: '12px 14px', outline: 'none' }}
              />
              <button
                type="submit"
                disabled={!friendUsername.trim() || addFriendBusy}
                className="dash-btn"
                style={{ padding: '12px 20px', borderRadius: '100px', border: 'none', background: friendUsername.trim() && !addFriendBusy ? accentLime : 'rgba(212,255,62,0.25)', color: bgDark, fontWeight: 800, cursor: friendUsername.trim() && !addFriendBusy ? 'pointer' : 'not-allowed' }}
              >
                {addFriendBusy ? 'Mengirim...' : '+ Kirim permintaan'}
              </button>
            </form>
            {addFriendError && <p style={{ margin: '10px 0 0', color: '#fca5a5', fontSize: '13px' }}>{addFriendError}</p>}

            {friendRequests.outgoing.length > 0 && (
              <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
                {friendRequests.outgoing.map((req) => (
                  <p key={req.friendship_id} style={{ margin: 0, color: textGray, fontSize: '13px' }}>
                    Menunggu <strong style={{ color: '#e2e8f0' }}>@{req.username}</strong> menerima permintaanmu.
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
            <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Kalender tersinkron</p>
            <h3 style={{ margin: '10px 0 6px', fontSize: '1.25rem', fontWeight: 800 }}>Teman yang tersedia saat kamu luang</h3>
            <p style={{ margin: '0 0 18px', color: '#cbd5e1', lineHeight: 1.6 }}>CareMatch membandingkan blok waktu luangmu dengan kalender teman yang tersambung.</p>

            {inviteError && <p style={{ margin: '0 0 14px', color: '#fca5a5', fontSize: '13px' }}>{inviteError}</p>}

            {careMatchMatchesLoading ? (
              <p style={{ margin: 0, color: '#cbd5e1' }}>Memuat waktu luang bersama...</p>
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
                        <p style={{ margin: 0, fontWeight: 800 }}>{match.name} tersedia</p>
                        <p style={{ margin: '5px 0 0', color: '#cbd5e1', fontSize: '14px' }}>
                          Waktu luang yang sama: {formatLocalTime(match.overlap_start)}–{formatLocalTime(match.overlap_end)}
                          {match.suggested_activity ? ` · ${match.suggested_activity}` : ''}
                        </p>
                      </div>
                      <button onClick={() => inviteFriend(match)} disabled={alreadySent || busy} className="dash-btn" style={{ padding: '11px 18px', borderRadius: '100px', border: 'none', background: alreadySent ? 'rgba(212,255,62,0.22)' : accentLime, color: bgDark, fontWeight: 800, cursor: alreadySent || busy ? 'default' : 'pointer' }}>
                        {alreadySent ? 'Undangan terkirim' : busy ? 'Mengirim...' : `Ajak ${match.suggested_activity ? match.suggested_activity.toLowerCase() : 'beraktivitas'} bersama`}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ margin: 0, color: '#cbd5e1' }}>Belum ada teman yang memiliki waktu luang yang sama. Tambahkan teman lain untuk mencoba lagi.</p>
            )}
          </section>
        </>
      )}
    </PageShell>
  );
}
