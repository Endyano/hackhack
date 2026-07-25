import type { ReactNode } from 'react';

type CheckinShellProps = {
  step: string;
  onBack: () => void;
  children: ReactNode;
};

const bgDark = '#090C0B';
const accentLime = '#D4FF3E';
const textGray = '#9CA3AF';

export default function CheckinShell({ step, onBack, children }: CheckinShellProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: bgDark,
        backgroundImage: `
          radial-gradient(circle at 85% 8%, rgba(212, 255, 62, 0.14) 0%, transparent 40%),
          radial-gradient(circle at 12% 92%, rgba(212, 255, 62, 0.12) 0%, transparent 40%),
          radial-gradient(circle at 50% 45%, rgba(212, 255, 62, 0.08) 0%, transparent 60%)
        `,
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>
        {`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .checkin-fade { opacity: 0; animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .checkin-back { transition: all 0.2s ease; }
          .checkin-back:hover { color: white !important; }
          .checkin-cta { transition: all 0.25s ease; }
          .checkin-cta:hover:not(:disabled) { transform: translateY(-4px) scale(1.03); box-shadow: 0 18px 34px rgba(212, 255, 62, 0.4) !important; }
        `}
      </style>

      {/* CORNER ORBITS — matches login page */}
      <div style={{ position: 'absolute', top: '-20%', right: '-15%', width: '900px', height: '900px', borderRadius: '50%', border: '1px solid rgba(212, 255, 62, 0.1)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-8%', right: '-5%', width: '650px', height: '650px', borderRadius: '50%', border: '1px dashed rgba(212, 255, 62, 0.12)', animation: 'spinSlow 70s linear infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-25%', left: '-15%', width: '1000px', height: '1000px', borderRadius: '50%', border: '1px solid rgba(212, 255, 62, 0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-6%', width: '700px', height: '700px', borderRadius: '50%', border: '1px dashed rgba(212, 255, 62, 0.1)', animation: 'spinSlow 90s linear infinite reverse', pointerEvents: 'none' }} />

      {/* TOP BAR */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 5%' }}>
        <button
          onClick={onBack}
          className="checkin-back"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: '100px',
            color: textGray,
            padding: '10px 22px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          ← Back
        </button>
        <span style={{ color: accentLime, fontSize: '12px', fontWeight: 900, letterSpacing: '0.14em' }}>{step}</span>
      </div>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '20px 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </main>

      <footer style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '24px 24px 40px' }}>
        <p style={{ margin: 0, color: textGray, fontSize: '11px', letterSpacing: '0.04em' }}>
          CareShift™ — Hackathon MVP Demo
        </p>
      </footer>
    </div>
  );
}
