'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '../Components/PageShell';
import { useDemoState } from '../Components/DemoStateContext';
import type { RecommendationState, SelectedMovement } from '../Components/DemoData';

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
  { state: 'accepted', emoji: '🏃', title: 'Easy Run', intensity: 'Easy', duration: 30, tags: ['Cardio', 'Outdoor'] },
  { state: 'accepted', emoji: '🚴', title: 'Easy Bike Ride', intensity: 'Easy', duration: 35, tags: ['Cardio', 'Outdoor', 'Low Impact'] },
  { state: 'accepted', emoji: '🥾', title: 'Nature Walk', intensity: 'Moderate', duration: 45, tags: ['Cardio', 'Outdoor', 'Low Impact'] },
  { state: 'accepted', emoji: '🏊', title: 'Swimming Laps', intensity: 'Moderate', duration: 30, tags: ['Cardio', 'Low Impact'] },
  { state: 'accepted', emoji: '🪢', title: 'Jump Rope Intervals', intensity: 'Vigorous', duration: 15, tags: ['Cardio', 'Indoor'] },
  { state: 'accepted', emoji: '💃', title: 'Dance Cardio', intensity: 'Moderate', duration: 25, tags: ['Cardio', 'Indoor'] },
  { state: 'shortened', emoji: '🏋️', title: 'Home Bodyweight Circuit', intensity: 'Light', duration: 20, tags: ['Strength', 'Indoor', 'Low Impact'] },
  { state: 'shortened', emoji: '💪', title: 'Upper-Body Strength', intensity: 'Moderate', duration: 25, tags: ['Strength', 'Indoor'] },
  { state: 'shortened', emoji: '🦵', title: 'Lower-Body Strength', intensity: 'Moderate', duration: 25, tags: ['Strength', 'Indoor'] },
  { state: 'shortened', emoji: '🧱', title: 'Core Stability Set', intensity: 'Light', duration: 15, tags: ['Strength', 'Indoor', 'Low Impact'] },
  { state: 'shortened', emoji: '🤸', title: 'Pilates Flow', intensity: 'Light', duration: 25, tags: ['Strength', 'Mobility', 'Indoor', 'Low Impact'] },
  { state: 'replaced', emoji: '🧘', title: 'Mobility + Breathing Break', intensity: 'Calm', duration: 20, tags: ['Mobility', 'Desk Stretches', 'Indoor', 'Low Impact'] },
  { state: 'replaced', emoji: '🧘‍♀️', title: 'Gentle Yoga Flow', intensity: 'Light', duration: 20, tags: ['Mobility', 'Indoor', 'Low Impact'] },
  { state: 'replaced', emoji: '🤹', title: 'Full-Body Mobility', intensity: 'Light', duration: 15, tags: ['Mobility', 'Indoor', 'Low Impact'] },
  { state: 'replaced', emoji: '🪑', title: 'Desk Reset Stretch', intensity: 'Very Light', duration: 10, tags: ['Mobility', 'Desk Stretches', 'Indoor', 'Low Impact'] },
  { state: 'replaced', emoji: '🫁', title: 'Breathing & Posture Reset', intensity: 'Calm', duration: 8, tags: ['Mobility', 'Desk Stretches', 'Indoor', 'Low Impact'] },
  { state: 'skipped', emoji: '🚶', title: 'Walk + Hydration', intensity: 'Easy', duration: 10, tags: ['Cardio', 'Outdoor', 'Low Impact'] },
  { state: 'skipped', emoji: '🌳', title: 'Park Stroll', intensity: 'Very Light', duration: 20, tags: ['Cardio', 'Outdoor', 'Low Impact'] },
  { state: 'skipped', emoji: '🧍', title: 'Standing Stretch Break', intensity: 'Very Light', duration: 5, tags: ['Mobility', 'Desk Stretches', 'Indoor', 'Low Impact'] },
  { state: 'skipped', emoji: '🛋️', title: 'Recovery Stretch', intensity: 'Very Light', duration: 12, tags: ['Mobility', 'Indoor', 'Low Impact'] },
];

const filters = ['All', 'Cardio', 'Strength', 'Mobility', 'Outdoor', 'Indoor', 'Low Impact', 'Desk Stretches'];

function buildMovementSession(activity: LibraryActivity): SelectedMovement {
  const mode = activity.tags.includes('Outdoor') ? 'outdoor' : 'indoor';
  const isStrength = activity.tags.includes('Strength');
  const isMobility = activity.tags.includes('Mobility');
  const steps = mode === 'outdoor'
    ? ['Easy warm-up', activity.title, 'Cool-down walk']
    : isStrength
      ? ['Dynamic warm-up', `${activity.title} sets`, 'Slow cool-down']
      : isMobility
        ? ['Settle your breath', activity.title, 'Gentle reset']
        : ['Light warm-up', `${activity.title} intervals`, 'Recovery stretch'];
  const metric = activity.title.includes('Bike')
    ? { value: '18.5', unit: 'km/h', label: 'Average Speed' }
    : activity.title.includes('Nature')
      ? { value: '4.2', unit: 'km/h', label: 'Walking Speed' }
      : activity.title.includes('Park')
        ? { value: '4.8', unit: 'km/h', label: 'Walking Speed' }
        : { value: '5:30', unit: '/km', label: 'Pace' };

  return { title: activity.title, intensity: activity.intensity, durationMinutes: activity.duration, mode, steps, metric };
}

export default function MovePage() {
  const router = useRouter();
  const { setRecommendationState, setSelectedMovement, setSessionSource } = useDemoState();
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = useMemo(
    () => (activeFilter === 'All' ? library : library.filter((item) => item.tags.includes(activeFilter))),
    [activeFilter],
  );

  const startActivity = (activity: LibraryActivity) => {
    setRecommendationState(activity.state);
    setSelectedMovement(buildMovementSession(activity));
    setSessionSource('move');
    router.push('/active-session');
  };

  return (
    <PageShell
      eyebrow="Feature · Move"
      title="Movement Library"
      description="Choose a session that supports your training goal, mobility, or recovery needs today."
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
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Choose the right physical care</h2>
          <p style={{ margin: '8px 0 0', color: textGray, fontSize: '14px' }}>Match your session to today’s training readiness and recovery needs.</p>
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
          ✨ Show Indoor Training Options
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
              <button onClick={() => startActivity(item)} className="move-card-cta">
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
