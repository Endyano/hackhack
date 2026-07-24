'use client';

import PageShell from '../Components/PageShell';
import { useDemoState } from '../Components/DemoStateContext';

const bgDark = '#090C0B';
const accentLime = '#D4FF3E';

export default function CareMatchPage() {
  const { currentUser, invitationState, setInvitationState } = useDemoState();

  return (
    <PageShell
      eyebrow="Fitur · CareMatch"
      title="CareMatch"
      description="Temukan teman untuk beraktivitas bersama dan bikin gerak tubuh terasa lebih menyenangkan."
    >
      <div
        style={{
          padding: '26px',
          borderRadius: '28px',
          background: 'linear-gradient(180deg, rgba(212, 255, 62, 0.06), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(212, 255, 62, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Cari teman aktivitas</h3>
          <span style={{ color: accentLime, fontSize: '0.9rem', fontWeight: 700 }}>Partner ready</span>
        </div>
        <p style={{ margin: '0 0 18px', color: '#cbd5e1', lineHeight: 1.7 }}>
          Daniel tersedia pada {currentUser.recommendation.overlapStart} &mdash; {currentUser.recommendation.overlapEnd}. Tawarkan aktivitas bersama untuk menjaga konsistensi.
        </p>
        <button
          onClick={() => setInvitationState('sent')}
          className="dash-btn"
          style={{ width: '100%', padding: '14px', borderRadius: '100px', border: 'none', background: accentLime, color: bgDark, fontWeight: 800, cursor: 'pointer' }}
        >
          Undang {currentUser.recommendation.friendName}
        </button>
        {invitationState === 'sent' && (
          <p style={{ margin: '14px 0 0 0', color: '#cbd5e1', fontSize: '13px' }}>Undangan terkirim. Menunggu tanggapan.</p>
        )}
      </div>

      {currentUser.id === 'daniel' && (
        <div style={{ padding: '26px', borderRadius: '28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Fitur · Undangan Masuk
          </p>
          <h3 style={{ margin: '10px 0 14px', fontSize: '1.2rem', fontWeight: 800 }}>Ajakan dari Eric</h3>
          <p style={{ margin: '0 0 18px', color: '#cbd5e1', lineHeight: 1.7 }}>
            Eric mengundangmu untuk easy run 30 menit pada 16:30.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={() => setInvitationState('accepted')}
              className="dash-btn"
              style={{ padding: '14px', borderRadius: '100px', border: 'none', background: accentLime, color: bgDark, fontWeight: 800, cursor: 'pointer' }}
            >
              Terima
            </button>
            <button
              onClick={() => setInvitationState('declined')}
              className="dash-btn"
              style={{ padding: '14px', borderRadius: '100px', border: '1px solid rgba(248, 113, 113, 0.35)', background: 'transparent', color: '#fbcfe8', cursor: 'pointer', fontWeight: 700 }}
            >
              Tolak
            </button>
          </div>
          {invitationState !== 'pending' && (
            <p style={{ margin: '16px 0 0 0', color: '#cbd5e1', fontSize: '13px' }}>
              Status undangan: <strong>{invitationState}</strong>.
            </p>
          )}
        </div>
      )}
    </PageShell>
  );
}
