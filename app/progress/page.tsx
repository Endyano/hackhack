'use client';

import PageShell from '../Components/PageShell';

const accentLime = '#D4FF3E';
const textGray = '#9CA3AF';

const stats = [
  { icon: '⚡', label: 'Readiness Matched', description: 'You chose recovery sessions when readiness was low.' },
  { icon: '🗓️', label: 'Training Planned', description: '3 sessions fitted into your real calendar gaps.' },
  { icon: '🤝', label: 'Partner Training', description: '1 shared training session completed.' },
];

const weeklyTraining = [
  { day: 'Mon', minutes: 35, kind: 'Strength' },
  { day: 'Tue', minutes: 20, kind: 'Mobility' },
  { day: 'Wed', minutes: 45, kind: 'Cardio' },
  { day: 'Thu', minutes: 0, kind: 'Recovery' },
  { day: 'Fri', minutes: 35, kind: 'Strength' },
  { day: 'Sat', minutes: 25, kind: 'Cardio' },
  { day: 'Sun', minutes: 0, kind: 'Recovery' },
];

const recentSessions = [
  { icon: '🏃', title: 'Easy Run', detail: '30 min · Cardio', date: 'Today' },
  { icon: '🧘', title: 'Mobility Flow', detail: '20 min · Recovery', date: 'Yesterday' },
  { icon: '💪', title: 'Upper-Body Strength', detail: '35 min · Strength', date: 'Mon' },
];

function DonutChart({ percent, size = 220, strokeWidth = 18 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={accentLime}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ filter: 'drop-shadow(0 0 12px rgba(212,255,62,0.55))', transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

export default function ProgressPage() {
  const alignmentScore = 85;

  return (
    <PageShell
      eyebrow="Feature · Progress"
      title="Training Progress"
      description="Track your training consistency, recovery choices, and physical-care progress over time."
      backgroundImage="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80"
    >
      <style>
        {`
          @keyframes insightGlowDrift {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.08); }
          }
          @keyframes badgePulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.6; }
          }
          .insight-card { position: relative; overflow: hidden; }
          .insight-glow {
            position: absolute;
            top: -45%;
            right: -8%;
            width: 380px;
            height: 380px;
            background: radial-gradient(circle, rgba(212,255,62,0.2), transparent 70%);
            pointer-events: none;
            animation: insightGlowDrift 6s ease-in-out infinite;
          }
          .insight-badge-dot { animation: badgePulse 2.2s ease-in-out infinite; }
          .alignment-grid { display: flex; gap: 48px; align-items: center; flex-wrap: wrap; }
          .stat-row {
            padding: 16px 20px;
            border-radius: 16px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
            transition: all 0.2s ease;
            line-height: 1.6;
          }
          .stat-row:hover { border-color: rgba(212, 255, 62, 0.3); background: rgba(255,255,255,0.05); }
          .fitness-metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
          .progress-detail-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 20px; }
          .training-bars { display: flex; align-items: end; justify-content: space-between; gap: 10px; height: 180px; padding-top: 18px; }
          @media (max-width: 820px) { .fitness-metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .progress-detail-grid { grid-template-columns: 1fr; } }
        `}
      </style>

      {/* 1. AI IMPACT INSIGHT */}
      <div
        className="insight-card"
        style={{
          borderRadius: '28px',
          padding: '32px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(212, 255, 62, 0.25)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35), 0 0 60px rgba(212,255,62,0.06)',
        }}
      >
        <div className="insight-glow" aria-hidden="true" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '100px',
              background: 'rgba(212, 255, 62, 0.12)',
              border: '1px solid rgba(212, 255, 62, 0.35)',
              color: accentLime,
              fontSize: '12px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <span className="insight-badge-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentLime }} />
            CareBot Insight ✨
          </span>

          <p style={{ margin: '20px 0 0', fontSize: 'clamp(1.3rem, 2.4vw, 1.7rem)', fontWeight: 800, lineHeight: 1.5, maxWidth: '760px' }}>
            You completed <span style={{ color: accentLime }}>3 recovery-aware sessions</span> this week. Placing them after your busiest calendar blocks supported consistency without overloading your body.
          </p>
        </div>
      </div>

      {/* 2. WELLBEING ALIGNMENT SCORE */}
      <div
        style={{
          borderRadius: '28px',
          padding: 'clamp(24px, 4vw, 36px)',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="alignment-grid">
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 220, height: 220 }}>
              <DonutChart percent={alignmentScore} size={220} strokeWidth={18} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '52px', fontWeight: 900, color: accentLime, letterSpacing: '-2px' }}>{alignmentScore}%</span>
              </div>
            </div>
            <p style={{ margin: '20px 0 0', color: textGray, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Weekly Alignment Score
            </p>
          </div>

          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.map((stat) => (
              <div key={stat.label} className="stat-row">
                <span style={{ color: accentLime, fontWeight: 800, fontSize: '15px' }}>
                  {stat.icon} {stat.label}:
                </span>{' '}
                <span style={{ color: '#e2e8f0', fontSize: '15px' }}>{stat.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. TRAINING SNAPSHOT */}
      <section>
        <p style={{ margin: '0 0 14px', color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>This Week</p>
        <div className="fitness-metric-grid">
          {[
            ['🔥', '4 / 5', 'Sessions completed'],
            ['⏱️', '135 min', 'Training volume'],
            ['📍', '12.4 km', 'Distance covered'],
            ['🌱', '3 days', 'Current streak'],
          ].map(([icon, value, label]) => (
            <div key={label} style={{ padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '22px' }}>{icon}</span>
              <p style={{ margin: '14px 0 3px', fontSize: '1.55rem', fontWeight: 900 }}>{value}</p>
              <p style={{ margin: 0, color: textGray, fontSize: '13px' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. WEEKLY LOAD, RECOVERY, AND HISTORY */}
      <div className="progress-detail-grid">
        <section style={{ padding: '26px', borderRadius: '28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'baseline' }}>
            <div>
              <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Weekly Load</p>
              <h2 style={{ margin: '8px 0 0', fontSize: '1.25rem' }}>Your training minutes</h2>
            </div>
            <span style={{ color: textGray, fontSize: '13px' }}>Goal: 150 min</span>
          </div>
          <div className="training-bars">
            {weeklyTraining.map((entry) => (
              <div key={entry.day} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                <div style={{ height: '132px', display: 'flex', alignItems: 'end', justifyContent: 'center' }}>
                  <div title={`${entry.day}: ${entry.minutes} min ${entry.kind}`} style={{ width: '100%', maxWidth: '30px', height: `${Math.max(entry.minutes * 2.5, entry.minutes ? 18 : 6)}px`, borderRadius: '10px 10px 4px 4px', background: entry.minutes ? accentLime : 'rgba(255,255,255,0.12)', boxShadow: entry.minutes ? '0 0 18px rgba(212,255,62,0.18)' : 'none' }} />
                </div>
                <p style={{ margin: '8px 0 0', color: textGray, fontSize: '11px', fontWeight: 700 }}>{entry.day}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: '26px', borderRadius: '28px', background: 'linear-gradient(160deg, rgba(74, 222, 128, 0.1), rgba(255,255,255,0.04))', border: '1px solid rgba(74, 222, 128, 0.25)' }}>
          <p style={{ margin: 0, color: '#86efac', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recovery Status</p>
          <h2 style={{ margin: '10px 0 0', fontSize: '1.5rem' }}>Ready for steady training</h2>
          <p style={{ margin: '10px 0 0', color: '#cbd5e1', lineHeight: 1.6, fontSize: '14px' }}>You balanced your last strength session with mobility work. Keep your next session moderate.</p>
          <div style={{ marginTop: '22px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}><div style={{ width: '76%', height: '100%', borderRadius: 'inherit', background: '#4ade80' }} /></div>
            <strong style={{ color: '#86efac', fontSize: '14px' }}>76%</strong>
          </div>
        </section>
      </div>

      <section style={{ padding: '26px', borderRadius: '28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recent Sessions</p>
        <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
          {recentSessions.map((session) => (
            <div key={session.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}><span style={{ fontSize: '22px' }}>{session.icon}</span><div><strong>{session.title}</strong><p style={{ margin: '4px 0 0', color: textGray, fontSize: '13px' }}>{session.detail}</p></div></div>
              <span style={{ color: textGray, fontSize: '13px' }}>{session.date}</span>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
