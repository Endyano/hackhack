'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandMark from './BrandMark';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';

const accentLime = '#D4FF3E';

export default function AppNav() {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

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
          onClick={handleLogout}
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
