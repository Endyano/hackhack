import type { Mood } from './CheckinData';
import { moodMeta } from './CheckinData';
import CheckinShell from './CheckinShell';

type MoodCheckInProps = {
  userName: string;
  selectedMood: Mood | null;
  onSelectMood: (mood: Mood) => void;
  onContinue: () => void;
  onBack: () => void;
};

const accentLime = '#D4FF3E';
const bgDark = '#090C0B';
const textGray = '#9CA3AF';

const moodOrder: Mood[] = ['positive', 'neutral', 'negative'];

export default function MoodCheckIn({ userName, selectedMood, onSelectMood, onContinue, onBack }: MoodCheckInProps) {
  return (
    <CheckinShell step="STEP 1 · MOOD" onBack={onBack}>
      <style>
        {`
          .mood-card { transition: all 0.2s ease; cursor: pointer; }
          .mood-card:hover { transform: translateY(-6px); border-color: rgba(212, 255, 62, 0.4) !important; }
        `}
      </style>

      <div style={{ width: '100%', maxWidth: '980px' }}>
        <p className="checkin-fade" style={{ margin: 0, fontSize: 'clamp(1.6rem, 3.6vw, 2.1rem)', fontWeight: 800, color: textGray }}>
          Hey <span style={{ color: accentLime, fontWeight: 900 }}>{userName}</span> 👋
        </p>
        <h1
          className="checkin-fade"
          style={{ animationDelay: '0.1s', margin: '14px 0 0', fontSize: 'clamp(3.2rem, 7.5vw, 5rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-2px' }}
        >
          How are you feeling today?
        </h1>

        <div
          className="checkin-fade"
          style={{ animationDelay: '0.2s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '52px' }}
        >
          {moodOrder.map((mood) => {
            const meta = moodMeta[mood];
            const isSelected = selectedMood === mood;
            return (
              <div
                key={mood}
                className="mood-card"
                onClick={() => onSelectMood(mood)}
                style={{
                  padding: '44px 26px',
                  borderRadius: '28px',
                  background: isSelected ? 'rgba(212, 255, 62, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? `2px solid ${accentLime}` : '2px solid rgba(255,255,255,0.1)',
                  boxShadow: isSelected ? '0 24px 48px rgba(212, 255, 62, 0.2)' : 'none',
                }}
              >
                <div style={{ fontSize: '84px', lineHeight: 1 }}>{meta.emoji}</div>
                <p style={{ margin: '24px 0 0', fontSize: '24px', fontWeight: 800, color: isSelected ? accentLime : 'white' }}>
                  {meta.label}
                </p>
              </div>
            );
          })}
        </div>

        {selectedMood && (
          <button
            onClick={onContinue}
            className="checkin-fade checkin-cta"
            style={{
              marginTop: '48px',
              padding: '21px 56px',
              borderRadius: '100px',
              border: 'none',
              background: accentLime,
              color: bgDark,
              fontWeight: 900,
              fontSize: '19px',
              cursor: 'pointer',
              boxShadow: '0 14px 30px rgba(212, 255, 62, 0.3)',
            }}
          >
            Continue
          </button>
        )}
      </div>
    </CheckinShell>
  );
}
