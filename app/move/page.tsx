'use client';

import PageShell from '../Components/PageShell';
import { useDemoState } from '../Components/DemoStateContext';
import { getActiveRecommendation } from '../Components/DemoData';
import { moodMeta, getCheckinRecommendation } from '../Components/AfterLogin/CheckinData';

const bgDark = '#090C0B';
const accentLime = '#D4FF3E';
const textGray = '#9CA3AF';

export default function MovePage() {
  const { currentUser, recommendationState, setRecommendationState, checkinMood, checkinEnergy } = useDemoState();
  const activeRec = getActiveRecommendation(currentUser, recommendationState);
  const todaysCheckin =
    checkinMood && checkinEnergy !== null
      ? { mood: checkinMood, energy: checkinEnergy, rec: getCheckinRecommendation(checkinMood, checkinEnergy) }
      : null;
  const heroRec = todaysCheckin ? todaysCheckin.rec : activeRec;

  return (
    <PageShell
      eyebrow="Fitur · Move"
      title="Move"
      description="Sesuaikan rekomendasi aktivitas hari ini berdasarkan mood, energi, dan waktu yang kamu punya."
    >
      {todaysCheckin && (
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '16px', fontWeight: 700 }}>
            {moodMeta[todaysCheckin.mood].emoji} {moodMeta[todaysCheckin.mood].label}
          </span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: accentLime }}>⚡ {todaysCheckin.energy}% Energy</span>
        </div>
      )}

      <div
        style={{
          borderRadius: '28px',
          background: 'linear-gradient(180deg, rgba(212, 255, 62, 0.06), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(212, 255, 62, 0.18)',
          padding: '26px',
        }}
      >
        <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Recommended for you
        </p>
        <h2 style={{ margin: '12px 0 0', fontSize: '1.7rem', fontWeight: 800 }}>{heroRec.activity}</h2>
        <p style={{ margin: '6px 0 0', color: accentLime, fontSize: '13px', fontWeight: 700 }}>{heroRec.intensity} intensity</p>
        <p style={{ margin: '10px 0 0', color: '#e2e8f0', lineHeight: 1.75 }}>{heroRec.reason}</p>

        {!todaysCheckin && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginTop: '20px' }}>
            {[
              { label: 'Durasi', value: `${activeRec.durationMinutes} menit` },
              { label: 'Mulai', value: activeRec.startTime },
              { label: 'Status', value: recommendationState === 'pending' ? 'Base plan' : recommendationState },
            ].map((item) => (
              <div key={item.label} style={{ padding: '16px', borderRadius: '18px', background: '#0f172a' }}>
                <p style={{ margin: 0, color: textGray, fontSize: '12px' }}>{item.label}</p>
                <p style={{ margin: '10px 0 0', fontWeight: 700 }}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setRecommendationState('accepted')}
          className="dash-btn"
          style={{ marginTop: '22px', width: '100%', padding: '15px', borderRadius: '100px', border: 'none', background: accentLime, color: bgDark, fontWeight: 800, cursor: 'pointer', fontSize: '15px' }}
        >
          Start Activity
        </button>

        {recommendationState !== 'pending' && (
          <p style={{ margin: '16px 0 0 0', color: '#cbd5e1', fontSize: '13px' }}>
            Status: <strong>{recommendationState}</strong>.{' '}
            {recommendationState === 'accepted' ? 'Rencana tersimpan ke riwayat aktivitasmu.' : ''}
          </p>
        )}
      </div>

      <div>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.3rem', fontWeight: 800 }}>Pilihan Lain</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <button
            onClick={() => setRecommendationState('shortened')}
            className="dash-btn"
            style={{ padding: '18px', borderRadius: '20px', border: '1px solid rgba(212, 255, 62, 0.35)', background: 'rgba(255,255,255,0.03)', color: '#f8fafc', cursor: 'pointer', fontWeight: 700, textAlign: 'left' }}
          >
            <span style={{ display: 'block', fontSize: '15px', fontWeight: 800 }}>Singkatkan</span>
            <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: textGray, fontWeight: 500 }}>
              20-minute home bodyweight session
            </span>
          </button>
          <button
            onClick={() => setRecommendationState('replaced')}
            className="dash-btn"
            style={{ padding: '18px', borderRadius: '20px', border: '1px solid rgba(148, 163, 184, 0.35)', background: 'rgba(255,255,255,0.03)', color: '#f8fafc', cursor: 'pointer', fontWeight: 700, textAlign: 'left' }}
          >
            <span style={{ display: 'block', fontSize: '15px', fontWeight: 800 }}>Alternatif Tenang</span>
            <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: textGray, fontWeight: 500 }}>
              Mobility routine + breathing break
            </span>
          </button>
          <button
            onClick={() => setRecommendationState('skipped')}
            className="dash-btn"
            style={{ padding: '18px', borderRadius: '20px', border: '1px solid rgba(248, 113, 113, 0.35)', background: 'rgba(255,255,255,0.03)', color: '#fbcfe8', cursor: 'pointer', fontWeight: 700, textAlign: 'left' }}
          >
            <span style={{ display: 'block', fontSize: '15px', fontWeight: 800 }}>Lewati</span>
            <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: textGray, fontWeight: 500 }}>
              10-minute walk and hydration break
            </span>
          </button>
        </div>
      </div>
    </PageShell>
  );
}
