'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDemoState } from './DemoStateContext';
import BrandMark from './BrandMark';

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
        padding: '32px 5%',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '18px', textDecoration: 'none', color: 'inherit' }}>
        <BrandMark size={60} />
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px' }}>
            CareShift<span style={{ fontSize: '13px', verticalAlign: 'super' }}>™</span>
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: accentLime, fontWeight: 800 }}>
            The Physical Care Decision Engine™
          </p>
        </div>
      </Link>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={() => setUser(userId === 'eric' ? 'daniel' : 'eric')}
          className="dash-btn"
          style={{
            borderRadius: '100px',
            border: '1px solid rgba(255,255,255,0.16)',
            background: 'rgba(255,255,255,0.04)',
            color: '#e2e8f0',
            padding: '16px 28px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '16px',
          }}
        >
          Switch User
        </button>
        <button
          onClick={() => router.push('/')}
          className="dash-btn"
          style={{
            borderRadius: '100px',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            background: 'rgba(248, 113, 113, 0.1)',
            color: '#fca5a5',
            padding: '16px 28px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '16px',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
