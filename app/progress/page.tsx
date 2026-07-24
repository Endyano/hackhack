'use client';

import PageShell from '../Components/PageShell';
import { useDemoState } from '../Components/DemoStateContext';

const textGray = '#9CA3AF';
const accentLime = '#D4FF3E';

export default function ProgressPage() {
  const { currentUser } = useDemoState();

  return (
    <PageShell
      eyebrow="Fitur · Progress"
      title="Progress"
      description="Pantau riwayat aktivitas dan kesejahteraan fisikmu dari waktu ke waktu."
      backgroundImage="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80"
    >
      <div style={{ borderRadius: '28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '26px' }}>
        <h2 style={{ margin: '0 0 18px', fontSize: '1.4rem', fontWeight: 800 }}>Riwayat Aktivitas</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {currentUser.history.map((item) => (
            <div
              key={item.activity}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '16px',
                alignItems: 'center',
                padding: '18px',
                borderRadius: '20px',
                background: '#0f172a',
              }}
            >
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{item.activity}</p>
                <p style={{ margin: 0, color: textGray, fontSize: '13px' }}>{item.date}</p>
              </div>
              <span style={{ color: item.status === 'Completed' ? accentLime : '#FBBF24', fontWeight: 800 }}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
