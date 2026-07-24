'use client';

import Link from 'next/link';
import { getActiveRecommendation } from '../DemoData';
import { moodMeta, getCheckinRecommendation } from '../AfterLogin/CheckinData';
import { useDemoState } from '../DemoStateContext';
import AppNav from '../AppNav';

const bgDark = '#090C0B';
const accentLime = '#D4FF3E';
const textGray = '#9CA3AF';

const navCards = [
  {
    href: '/move',
    emoji: '🏃',
    title: 'Move',
    description: 'Get a personalised activity recommendation based on how you feel today.',
    action: 'Explore',
  },
  {
    href: '/smart-calendar',
    emoji: '🗓️',
    title: 'Smart Calendar',
    description: 'Find the best time for movement based on your schedule and available free time.',
    action: 'View Calendar',
  },
  {
    href: '/carematch',
    emoji: '🤝',
    title: 'CareMatch',
    description: 'Find someone to move with and make physical activity more enjoyable.',
    action: 'Find a Buddy',
  },
  {
    href: '/progress',
    emoji: '📈',
    title: 'Progress',
    description: 'Track your movement, activities, and physical wellbeing over time.',
    action: 'View Progress',
  },
];

export default function Dashboard() {
  const { currentUser, recommendationState, checkinMood, checkinEnergy, setRecommendationState } = useDemoState();

  const activeRec = getActiveRecommendation(currentUser, recommendationState);
  const todaysCheckin =
    checkinMood && checkinEnergy !== null
      ? { mood: checkinMood, energy: checkinEnergy, rec: getCheckinRecommendation(checkinMood, checkinEnergy) }
      : null;
  const heroRec = todaysCheckin ? todaysCheckin.rec : activeRec;

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: bgDark,
        backgroundImage: `radial-gradient(circle at 85% 0%, rgba(212, 255, 62, 0.1) 0%, transparent 55%)`,
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <style>
        {`
          .dash-btn { transition: all 0.2s ease; }
          .dash-btn:hover { transform: translateY(-2px); }
          .feature-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
          .nav-card-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
          .nav-card {
            display: block;
            text-decoration: none;
            color: inherit;
            padding: 26px 22px;
            border-radius: 24px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            transition: all 0.2s ease;
          }
          .nav-card:hover {
            transform: translateY(-4px);
            border-color: rgba(212, 255, 62, 0.4);
            background: rgba(212, 255, 62, 0.05);
            box-shadow: 0 16px 30px rgba(0,0,0,0.3);
          }
          @media (max-width: 880px) {
            .feature-grid { grid-template-columns: 1fr; }
            .nav-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (max-width: 560px) {
            .nav-card-grid { grid-template-columns: 1fr; }
          }
        `}
      </style>

      <AppNav />

      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '32px 5% 60px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* GREETING */}
        <header>
          <p style={{ margin: 0, color: textGray, fontSize: '13px', fontWeight: 600 }}>{currentDate}</p>
          <h1 style={{ margin: '10px 0 0', fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 900, letterSpacing: '-1px' }}>
            Halo, <span style={{ color: accentLime }}>{currentUser.name}</span>
          </h1>
          <p style={{ margin: '10px 0 0', color: '#cbd5e1', maxWidth: '680px', fontSize: '15px' }}>
            Ini tampilan demo yang menunjukkan perkiraan hari, momen yang cocok untuk latihan, dan rekomendasi kesehatan yang mudah diikuti.
          </p>
        </header>

        {/* HERO: TODAY'S CHECK-IN + RECOMMENDED ACTIVITY */}
        <div
          style={{
            borderRadius: '32px',
            background: 'linear-gradient(135deg, rgba(212, 255, 62, 0.12), rgba(15, 23, 42, 0.92))',
            border: '1px solid rgba(212, 255, 62, 0.25)',
            padding: '32px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '28px',
            justifyContent: 'space-between',
            boxShadow: '0 30px 70px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div style={{ flex: '1 1 280px' }}>
            <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Today&apos;s Check-in
            </p>
            <p style={{ margin: '12px 0 0', fontSize: '1.4rem', fontWeight: 800 }}>Good to see you, {currentUser.name} 👋</p>

            {todaysCheckin ? (
              <div style={{ display: 'flex', gap: '18px', marginTop: '18px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>
                  {moodMeta[todaysCheckin.mood].emoji} {moodMeta[todaysCheckin.mood].label}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: accentLime }}>⚡ {todaysCheckin.energy}% Energy</span>
              </div>
            ) : (
              <div style={{ marginTop: '18px' }}>
                <p style={{ margin: 0, color: textGray, fontSize: '14px' }}>Belum check-in hari ini.</p>
                <Link
                  href={`/checkin/mood?user=${currentUser.id}`}
                  className="dash-btn"
                  style={{
                    display: 'inline-block',
                    marginTop: '14px',
                    padding: '12px 22px',
                    borderRadius: '100px',
                    border: `1px solid rgba(212, 255, 62, 0.4)`,
                    color: accentLime,
                    fontWeight: 800,
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  Mulai Check-in →
                </Link>
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 360px', maxWidth: '460px', background: '#0f172a', borderRadius: '22px', padding: '24px 26px' }}>
            <p style={{ margin: 0, color: textGray, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Recommended for you
            </p>
            <p style={{ margin: '10px 0 0', fontSize: '1.35rem', fontWeight: 800 }}>{heroRec.activity}</p>
            <p style={{ margin: '4px 0 0', color: accentLime, fontSize: '13px', fontWeight: 700 }}>{heroRec.intensity} intensity</p>
            <p style={{ margin: '10px 0 0', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.65 }}>{heroRec.reason}</p>

            <button
              onClick={() => setRecommendationState('accepted')}
              className="dash-btn"
              style={{ marginTop: '18px', width: '100%', padding: '15px', borderRadius: '100px', border: 'none', background: accentLime, color: bgDark, fontWeight: 800, cursor: 'pointer', fontSize: '15px' }}
            >
              Start Activity
            </button>

            <Link
              href="/move"
              style={{ display: 'block', textAlign: 'center', marginTop: '12px', color: textGray, fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}
            >
              Explore other options →
            </Link>
          </div>
        </div>

        {/* WHAT WOULD YOU LIKE TO DO TODAY */}
        <div>
          <p style={{ margin: '0 0 8px', color: textGray, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Navigasi
          </p>
          <h2 style={{ margin: '0 0 20px', fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
            What would you like to do today?
          </h2>
          <div className="nav-card-grid">
            {navCards.map((card) => (
              <Link key={card.href} href={card.href} className="nav-card">
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'rgba(212, 255, 62, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    marginBottom: '18px',
                  }}
                >
                  {card.emoji}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 800 }}>{card.title}</h3>
                <p style={{ margin: 0, color: textGray, fontSize: '13px', lineHeight: 1.55, minHeight: '54px' }}>{card.description}</p>
                <span style={{ display: 'inline-block', marginTop: '16px', color: accentLime, fontWeight: 800, fontSize: '13px' }}>
                  {card.action} →
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* SUPPORTING INFORMATION */}
        <div>
          <p style={{ margin: '0 0 16px', color: textGray, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Informasi Pendukung
          </p>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '24px' }}>
            {[
              { label: 'Mood', value: currentUser.mood },
              { label: 'Energy', value: currentUser.energy },
              { label: 'Readiness', value: currentUser.readiness },
              { label: 'Lokasi', value: currentUser.location },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '22px',
                  borderRadius: '24px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <p style={{ margin: 0, color: textGray, fontSize: '13px', fontWeight: 600 }}>{item.label}</p>
                <p style={{ margin: '10px 0 0', fontSize: '1.4rem', fontWeight: 800, color: accentLime }}>{item.value}</p>
              </div>
            ))}
          </section>

          <div className="feature-grid">
            {/* FEATURE: DAILY CHECK-IN */}
            <div
              style={{
                borderRadius: '28px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '26px',
              }}
            >
              <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Fitur · Check-In
              </p>
              <h2 style={{ margin: '10px 0 16px', fontSize: '1.3rem', fontWeight: 800 }}>Daily Check-In</h2>
              <div style={{ display: 'grid', gap: '14px' }}>
                {[
                  ['Mood', currentUser.mood],
                  ['Energy', currentUser.energy],
                  ['Readiness', currentUser.readiness],
                  ['Lokasi', currentUser.location],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      alignItems: 'center',
                      padding: '18px',
                      borderRadius: '18px',
                      background: '#0f172a',
                    }}
                  >
                    <span style={{ color: textGray }}>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <p style={{ margin: '20px 0 0', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.7 }}>
                Catatan: {currentUser.notes}
              </p>
            </div>

            {/* FEATURE: SMART CALENDAR PREVIEW */}
            <div style={{ padding: '26px', borderRadius: '28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
              <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Preview · Smart Calendar
              </p>
              <p style={{ margin: '14px 0 0', color: '#f8fafc', fontSize: '15px', fontWeight: 700 }}>
                You have {currentUser.freeSlots[0].usableMinutes} minutes available today.
              </p>
              <p style={{ margin: '10px 0 0', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.6 }}>
                Smart Calendar recommends a {activeRec.durationMinutes}-minute {activeRec.activity.toLowerCase()} at {activeRec.startTime}.
              </p>
              <Link
                href="/smart-calendar"
                className="dash-btn"
                style={{ marginTop: 'auto', paddingTop: '18px', color: accentLime, fontWeight: 800, fontSize: '13px', textDecoration: 'none' }}
              >
                View Smart Calendar →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
