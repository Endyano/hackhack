'use client';

import PageShell from '../Components/PageShell';

const accentLime = '#D4FF3E';
const textGray = '#9CA3AF';

const stats = [
  { icon: '⚡', label: 'Energy Matched', description: 'You chose light routines on low-energy days.' },
  { icon: '🗓️', label: 'Schedule Optimized', description: '3 routines squeezed into free calendar gaps.' },
  { icon: '🤝', label: 'Social Sync', description: '1 joint CareMatch session completed.' },
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
      title="Progress"
      description="Track your activity history and physical wellbeing over time."
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
            You reduced your daily stress levels by <span style={{ color: accentLime }}>40%</span> this week. Executing those 3 short walks right after your busiest calendar blocks kept your mood stable.
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
    </PageShell>
  );
}
