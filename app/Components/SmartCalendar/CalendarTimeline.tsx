import type { CalendarEntry } from '../DemoData';
import { typeColor, typeLabel, toMinutes } from './calendarStyles';

type CalendarTimelineProps = {
  entries: CalendarEntry[];
};

const textGray = '#9CA3AF';
const accentLime = '#D4FF3E';

const DAY_START = 6 * 60;
const DAY_END = 23 * 60;
const RANGE = DAY_END - DAY_START;

export default function CalendarTimeline({ entries }: CalendarTimelineProps) {
  const sorted = [...entries].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const usedTypes = Array.from(new Set(sorted.map((entry) => entry.type)));

  return (
    <div style={{ borderRadius: '28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '26px' }}>
      <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        Kalender Hari Ini
      </p>
      <h2 style={{ margin: '10px 0 0', fontSize: '1.3rem', fontWeight: 800 }}>Jadwal &amp; Waktu Luang</h2>

      <div style={{ position: 'relative', height: '64px', marginTop: '24px', borderRadius: '16px', background: '#0f172a', overflow: 'hidden' }}>
        {sorted.map((entry, index) => {
          const start = Math.max(toMinutes(entry.start), DAY_START);
          const end = Math.min(toMinutes(entry.end), DAY_END);
          const left = ((start - DAY_START) / RANGE) * 100;
          const width = Math.max(((end - start) / RANGE) * 100, 2);
          return (
            <div
              key={`${entry.title}-${entry.start}-${index}`}
              title={`${entry.title} · ${entry.start}–${entry.end}`}
              style={{
                position: 'absolute',
                left: `${left}%`,
                width: `${width}%`,
                top: 0,
                bottom: 0,
                background: typeColor[entry.type],
                opacity: 0.9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
                color: '#0f172a',
                overflow: 'hidden',
                padding: '0 6px',
                whiteSpace: 'nowrap',
                borderRight: '2px solid #0f172a',
              }}
            >
              {entry.title}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: textGray, fontSize: '11px', fontWeight: 600 }}>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '20px' }}>
        {usedTypes.map((type) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: typeColor[type] }} />
            <span style={{ fontSize: '12px', color: textGray, fontWeight: 600 }}>{typeLabel[type]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
