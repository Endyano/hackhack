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

      <div style={{ width: '100%', maxWidth: '920px' }}>
        <p className="checkin-fade" style={{ margin: 0, fontSize: 'clamp(1.8rem, 4.2vw, 2.5rem)', fontWeight: 900, letterSpacing: '-1px' }}>
          Welcome back, <span style={{ color: accentLime }}>{userName}</span> 👋
        </p>
        <h1
          className="checkin-fade"
          style={{ animationDelay: '0.1s', margin: '20px 0 0', fontSize: 'clamp(2.6rem, 6vw, 3.8rem)', fontWeight: 900, lineHeight: 1.03, letterSpacing: '-1.5px' }}
        >
          How are you feeling today?
        </h1>
        <p
          className="checkin-fade"
          style={{ animationDelay: '0.15s', margin: '18px 0 0', fontSize: '17px', color: textGray, lineHeight: 1.65, maxWidth: '560px' }}
        >
          Your mood shapes how CareShift paces today&apos;s recommendation — no pressure, just an honest read on how you feel right now.
        </p>

        <div
          className="checkin-fade"
          style={{ animationDelay: '0.2s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '24px', marginTop: '48px' }}
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
                  padding: '40px 26px',
                  borderRadius: '28px',
                  background: isSelected ? 'rgba(212, 255, 62, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? `2px solid ${accentLime}` : '2px solid rgba(255,255,255,0.1)',
                  boxShadow: isSelected ? '0 24px 48px rgba(212, 255, 62, 0.2)' : 'none',
                }}
              >
                <div style={{ fontSize: '68px', lineHeight: 1 }}>{meta.emoji}</div>
                <p style={{ margin: '22px 0 0', fontSize: '19px', fontWeight: 800, color: isSelected ? accentLime : 'white' }}>
                  {meta.label}
                </p>
                <p style={{ margin: '10px 0 0', fontSize: '13px', color: textGray, lineHeight: 1.6 }}>{meta.description}</p>
              </div>
            );
          })}
        </div>

        {selectedMood && (
          <button
            onClick={onContinue}
            className="checkin-fade checkin-cta"
            style={{
              marginTop: '44px',
              padding: '20px 52px',
              borderRadius: '100px',
              border: 'none',
              background: accentLime,
              color: bgDark,
              fontWeight: 900,
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: '0 14px 30px rgba(212, 255, 62, 0.3)',
            }}
          >
            Continue
          </button>
        )}

        {!selectedMood && (
          <p style={{ marginTop: '44px', color: textGray, fontSize: '14px' }}>Pilih salah satu mood untuk melanjutkan.</p>
        )}
      </div>
    </CheckinShell>
  );
}
