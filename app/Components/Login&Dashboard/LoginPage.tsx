import type { SubmitEvent } from 'react';

type LoginPageProps = {
  username: string;
  password: string;
  error: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLogin: (event: SubmitEvent<HTMLFormElement>) => void;
  onBack: () => void;
};

const bgDark = '#090C0B';
const accentLime = '#D4FF3E';
const textGray = '#9CA3AF';

export default function LoginPage({
  username,
  password,
  error,
  onUsernameChange,
  onPasswordChange,
  onLogin,
  onBack,
}: LoginPageProps) {
  const fillDemo = (id: 'eric' | 'daniel') => {
    onUsernameChange(id);
    onPasswordChange('demo');
  };

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
          @keyframes spinSlowCentered {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
          .login-fade { opacity: 0; animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .login-submit { transition: all 0.25s ease; }
          .login-submit:hover { transform: translateY(-4px) scale(1.03); box-shadow: 0 18px 34px rgba(212, 255, 62, 0.4) !important; }
          .login-chip { transition: all 0.2s ease; cursor: pointer; }
          .login-chip:hover { transform: translateY(-2px); background: rgba(212, 255, 62, 0.16) !important; border-color: rgba(212, 255, 62, 0.5) !important; }
          .login-back { transition: all 0.2s ease; }
          .login-back:hover { color: white !important; }
          .login-input { transition: border-color 0.2s ease, background 0.2s ease; text-align: center; }
          .login-input:focus { border-color: ${accentLime} !important; background: rgba(255,255,255,0.05) !important; }
          .login-input::placeholder { text-align: center; }
        `}
      </style>

      {/* CORNER ORBITS — anchored to top/bottom edges so the canvas reads as designed at any viewport height */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-15%',
          width: '900px',
          height: '900px',
          borderRadius: '50%',
          border: '1px solid rgba(212, 255, 62, 0.1)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '-8%',
          right: '-5%',
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          border: '1px dashed rgba(212, 255, 62, 0.12)',
          animation: 'spinSlow 70s linear infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-25%',
          left: '-15%',
          width: '1000px',
          height: '1000px',
          borderRadius: '50%',
          border: '1px solid rgba(212, 255, 62, 0.08)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-6%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          border: '1px dashed rgba(212, 255, 62, 0.1)',
          animation: 'spinSlow 90s linear infinite reverse',
          pointerEvents: 'none',
        }}
      />

      {/* SUBTLE CENTER RING behind the form */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '900px',
          height: '900px',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: '1px solid rgba(212, 255, 62, 0.08)',
          pointerEvents: 'none',
        }}
      />

      {/* TOP BAR */}
      <div style={{ position: 'relative', zIndex: 1, padding: '32px 5%' }}>
        <button
          onClick={onBack}
          className="login-back"
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
      <div style={{ width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* LOGO */}
        <div className="login-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <div
            style={{
              width: '104px',
              height: '104px',
              backgroundColor: accentLime,
              borderRadius: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: bgDark,
              fontWeight: 900,
              fontSize: '52px',
              fontStyle: 'italic',
              boxShadow: '0 0 48px rgba(212, 255, 62, 0.3)',
            }}
          >
            C
          </div>
          <h2 style={{ margin: 0, fontSize: '34px', fontWeight: 900, letterSpacing: '-0.5px' }}>
            CareShift<span style={{ fontSize: '16px', verticalAlign: 'super' }}>™</span>
          </h2>
        </div>

        <h1
          className="login-fade"
          style={{ animationDelay: '0.1s', margin: 0, fontSize: 'clamp(3.4rem, 8vw, 5.2rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-2px' }}
        >
          Log in to a <span style={{ color: accentLime }}>demo</span> account
        </h1>

        {/* QUICK DEMO CHIPS */}
        <div className="login-fade" style={{ animationDelay: '0.2s', display: 'flex', gap: '18px', marginTop: '44px' }}>
          <button
            type="button"
            onClick={() => fillDemo('eric')}
            className="login-chip"
            style={{
              background: 'rgba(212, 255, 62, 0.08)',
              border: '2px solid rgba(212, 255, 62, 0.3)',
              borderRadius: '100px',
              padding: '19px 38px',
              color: accentLime,
              fontSize: '19px',
              fontWeight: 800,
            }}
          >
            Eric
          </button>
          <button
            type="button"
            onClick={() => fillDemo('daniel')}
            className="login-chip"
            style={{
              background: 'rgba(212, 255, 62, 0.08)',
              border: '2px solid rgba(212, 255, 62, 0.3)',
              borderRadius: '100px',
              padding: '19px 38px',
              color: accentLime,
              fontSize: '19px',
              fontWeight: 800,
            }}
          >
            Daniel
          </button>
        </div>

        <form
          onSubmit={onLogin}
          className="login-fade"
          style={{ animationDelay: '0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '40px', width: '100%', maxWidth: '520px' }}
        >
          <input
            className="login-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            style={{
              width: '100%',
              padding: '24px 26px',
              borderRadius: '20px',
              border: '2px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.03)',
              color: 'white',
              outline: 'none',
              fontSize: '19px',
              boxSizing: 'border-box',
            }}
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            style={{
              width: '100%',
              padding: '24px 26px',
              borderRadius: '20px',
              border: '2px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.03)',
              color: 'white',
              outline: 'none',
              fontSize: '19px',
              boxSizing: 'border-box',
            }}
          />

          {error && <p style={{ margin: 0, color: '#fb7185', fontSize: '15px', fontWeight: 700 }}>{error}</p>}

          <button
            type="submit"
            className="login-submit"
            style={{
              width: '100%',
              padding: '24px 18px',
              borderRadius: '100px',
              border: 'none',
              background: accentLime,
              color: bgDark,
              fontWeight: 900,
              fontSize: '20px',
              cursor: 'pointer',
              boxShadow: '0 12px 28px rgba(212, 255, 62, 0.28)',
              marginTop: '8px',
            }}
          >
            Log in to Dashboard
          </button>
        </form>
      </div>
      </main>

      <footer style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '24px 24px 40px' }}>
        <p style={{ margin: 0, color: textGray, fontSize: '11px', letterSpacing: '0.04em' }}>
          CareShift™ — Hackathon MVP Demo
        </p>
      </footer>
    </div>
  );
}
