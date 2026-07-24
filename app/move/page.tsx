'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '../Components/PageShell';
import { useDemoState } from '../Components/DemoStateContext';
import type { RecommendationState } from '../Components/DemoData';

const bgDark = '#090C0B';
const accentLime = '#D4FF3E';
const textGray = '#9CA3AF';

type LibraryActivity = {
  state: RecommendationState;
  emoji: string;
  title: string;
  intensity: string;
  duration: number;
  tags: string[];
};

const library: LibraryActivity[] = [
  { state: 'accepted', emoji: '🏃', title: 'Easy Run', intensity: 'Easy', duration: 30, tags: [] },
  { state: 'shortened', emoji: '🏋️', title: '20-Min Home Bodyweight', intensity: 'Light', duration: 20, tags: ['Indoor', 'Low Impact'] },
  { state: 'replaced', emoji: '🧘', title: 'Mobility + Breathing Break', intensity: 'Calm', duration: 20, tags: ['Desk Stretches', 'Indoor', 'Low Impact'] },
  { state: 'skipped', emoji: '🚶', title: '10-Min Walk + Hydration', intensity: 'Easy', duration: 10, tags: ['Indoor', 'Low Impact'] },
];

const filters = ['All', 'Desk Stretches', 'Low Impact', 'Indoor'];

export default function MovePage() {
  const router = useRouter();
  const { setRecommendationState } = useDemoState();
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = useMemo(
    () => (activeFilter === 'All' ? library : library.filter((item) => item.tags.includes(activeFilter))),
    [activeFilter],
  );

  const startActivity = (state: RecommendationState) => {
    setRecommendationState(state);
    router.push('/active-session');
  };

  return (
    <PageShell
      eyebrow="Fitur · Move"
      title="Move"
      description="Cari aktivitas lain kalau rekomendasi utama nggak cocok buat kamu hari ini."
      backgroundImage="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1920&q=80"
    >
      <style>
        {`
          .move-ask-btn { transition: all 0.2s ease; }
          .move-ask-btn:hover { transform: translateY(-2px); background: rgba(212, 255, 62, 0.18) !important; }
          .move-filter-pill { transition: all 0.2s ease; }
          .move-filter-pill:hover { border-color: rgba(212, 255, 62, 0.5); }
          .move-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
          .move-card {
            padding: 26px;
            border-radius: 24px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
            transition: all 0.2s ease;
          }
          .move-card:hover {
            transform: translateY(-4px);
            border-color: rgba(212, 255, 62, 0.35);
            box-shadow: 0 16px 32px rgba(0,0,0,0.3);
          }
          .move-card-icon {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            background: rgba(212, 255, 62, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            margin-bottom: 18px;
          }
          .move-card-cta {
            display: inline-block;
            margin-top: 20px;
            background: none;
            border: none;
            padding: 0;
            color: ${accentLime};
            font-weight: 800;
            font-size: 14px;
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          .move-card:hover .move-card-cta { transform: translateX(4px); }
          @media (max-width: 900px) {
            .move-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (max-width: 600px) {
            .move-grid { grid-template-columns: 1fr; }
          }
        `}
      </style>

      {/* NEED SOMETHING ELSE BANNER */}
      <div
        style={{
          borderRadius: '28px',
          padding: '28px 32px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Need something else?</h2>
          <p style={{ margin: '8px 0 0', color: textGray, fontSize: '14px' }}>It's all good — pick whatever fits your day.</p>
        </div>
        <button
          onClick={() => setActiveFilter('Indoor')}
          className="move-ask-btn"
          style={{
            padding: '14px 24px',
            borderRadius: '100px',
            border: '1px solid rgba(212, 255, 62, 0.4)',
            background: 'rgba(212, 255, 62, 0.1)',
            color: accentLime,
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ✨ Ask CareBot for Indoor Alternatives
        </button>
      </div>

      {/* FILTER PILLS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className="move-filter-pill"
            style={{
              padding: '10px 20px',
              borderRadius: '100px',
              border: `1px solid ${activeFilter === filter ? accentLime : 'rgba(255,255,255,0.12)'}`,
              background: activeFilter === filter ? accentLime : 'rgba(255,255,255,0.03)',
              color: activeFilter === filter ? bgDark : '#e2e8f0',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* ACTIVITY GRID */}
      <div className="move-grid">
        {filtered.map((item) => (
          <div key={item.title} className="move-card">
            <div className="move-card-icon">{item.emoji}</div>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.15rem', fontWeight: 800 }}>{item.title}</h3>
            <span
              style={{
                display: 'inline-block',
                padding: '5px 12px',
                borderRadius: '100px',
                background: 'rgba(212, 255, 62, 0.1)',
                border: '1px solid rgba(212, 255, 62, 0.3)',
                color: accentLime,
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              {item.intensity} · {item.duration} min
            </span>
            <div>
              <button onClick={() => startActivity(item.state)} className="move-card-cta">
                Start →
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ margin: 0, color: textGray, gridColumn: '1 / -1' }}>No activities match this filter yet.</p>
        )}
      </div>
    </PageShell>
  );
}
