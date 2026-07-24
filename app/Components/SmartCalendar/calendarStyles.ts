import type { CalendarEntry } from '../DemoData';

const accentLime = '#D4FF3E';

export const typeColor: Record<CalendarEntry['type'], string> = {
  class: '#60A5FA',
  free: '#94a3b8',
  meal: '#FBBF24',
  study: '#A78BFA',
  activity: accentLime,
  match: accentLime,
};

export const typeLabel: Record<CalendarEntry['type'], string> = {
  class: 'Kelas',
  free: 'Waktu Luang',
  meal: 'Makan',
  study: 'Belajar',
  activity: 'AI Suggestion',
  match: 'AI Match ✨',
};

export function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number) {
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
}
