import { getEnergyLabel } from './CheckinData';
import CheckinShell from './CheckinShell';

type EnergyCheckInProps = {
  userName: string;
  energy: number;
  onEnergyChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
  submitting?: boolean;
};

const accentLime = '#D4FF3E';
const bgDark = '#090C0B';
const textGray = '#9CA3AF';

export default function EnergyCheckIn({ userName, energy, onEnergyChange, onContinue, onBack, submitting }: EnergyCheckInProps) {
  return (
    <CheckinShell step="STEP 2 · ENERGY" onBack={onBack}>
      <style>
        {`
          .energy-slider {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 16px;
            border-radius: 100px;
            background: linear-gradient(90deg, ${accentLime} ${energy}%, rgba(255,255,255,0.1) ${energy}%);
            outline: none;
          }
          .energy-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${accentLime};
            border: 5px solid ${bgDark};
            box-shadow: 0 6px 18px rgba(212, 255, 62, 0.55);
            cursor: pointer;
          }
          .energy-slider::-moz-range-thumb {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${accentLime};
            border: 5px solid ${bgDark};
            box-shadow: 0 6px 18px rgba(212, 255, 62, 0.55);
            cursor: pointer;
          }
        `}
      </style>

      <div style={{ width: '100%', maxWidth: '760px' }}>
        <p className="checkin-fade" style={{ margin: 0, fontSize: '17px', color: accentLime, fontWeight: 900, letterSpacing: '0.16em' }}>
          {userName.toUpperCase()}
        </p>
        <h1
          className="checkin-fade"
          style={{ animationDelay: '0.1s', margin: '16px 0 0', fontSize: 'clamp(3.2rem, 7.5vw, 5rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-2px' }}
        >
          How much energy do you have today?
        </h1>

        <div className="checkin-fade" style={{ animationDelay: '0.15s', marginTop: '60px' }}>
          <p style={{ margin: 0, fontSize: 'clamp(5rem, 12vw, 8rem)', fontWeight: 900, color: accentLime, lineHeight: 1 }}>
            {energy}%
          </p>
          <p style={{ margin: '18px 0 0', fontSize: '24px', fontWeight: 700, color: 'white' }}>{getEnergyLabel(energy)}</p>

          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={energy}
            onChange={(e) => onEnergyChange(Number(e.target.value))}
            className="energy-slider"
            style={{ marginTop: '40px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: '#64748b', fontSize: '13px', fontWeight: 700 }}>
            <span>0% · Low</span>
            <span>50% · Medium</span>
            <span>100% · High</span>
          </div>
        </div>

        <button
          onClick={onContinue}
          disabled={submitting}
          className="checkin-fade checkin-cta"
          style={{
            animationDelay: '0.3s',
            marginTop: '48px',
            padding: '21px 52px',
            borderRadius: '100px',
            border: 'none',
            background: accentLime,
            color: bgDark,
            fontWeight: 900,
            fontSize: '18px',
            cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            boxShadow: '0 14px 30px rgba(212, 255, 62, 0.3)',
          }}
        >
          {submitting ? 'Finding your plan…' : 'Continue'}
        </button>
      </div>
    </CheckinShell>
  );
}
