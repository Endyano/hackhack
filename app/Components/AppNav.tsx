'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDemoState } from './DemoStateContext';

const bgDark = '#090C0B';
const accentLime = '#D4FF3E';

export default function AppNav() {
  const router = useRouter();
  const { userId, setUser } = useDemoState();

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 5%',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', color: 'inherit' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            backgroundColor: accentLime,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: bgDark,
            fontWeight: 900,
            fontSize: '22px',
            fontStyle: 'italic',
          }}
        >
          C
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>
            CareShift<span style={{ fontSize: '10px', verticalAlign: 'super' }}>™</span>
          </h2>
          <p style={{ margin: 0, fontSize: '11px', color: accentLime, fontWeight: 800 }}>
            The Wellbeing Decision Engine™
          </p>
        </div>
      </Link>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setUser(userId === 'eric' ? 'daniel' : 'eric')}
          className="dash-btn"
          style={{
            borderRadius: '100px',
            border: '1px solid rgba(255,255,255,0.16)',
            background: 'rgba(255,255,255,0.04)',
            color: '#e2e8f0',
            padding: '12px 20px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          Ganti Pengguna
        </button>
        <button
          onClick={() => router.push('/')}
          className="dash-btn"
          style={{
            borderRadius: '100px',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            background: 'rgba(248, 113, 113, 0.1)',
            color: '#fca5a5',
            padding: '12px 20px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
