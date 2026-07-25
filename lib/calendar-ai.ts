import type { CalendarEventInput } from './calendar-events';

export type ParsedCalendarEntry = CalendarEventInput & { date: string; startTime: string; endTime: string };

export async function interpretCalendarCommand(accessToken: string, input: string): Promise<ParsedCalendarEntry[]> {
  const response = await fetch('/api/calendar/interpret', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  const body = await response.json().catch(() => null) as { error?: string; events?: Array<Pick<ParsedCalendarEntry, 'title' | 'date' | 'startTime' | 'endTime' | 'type'>> } | null;
  if (!response.ok || !body?.events?.length) throw new Error(body?.error ?? 'CareBot could not understand that calendar request.');

  return body.events.map((event) => {
    const toIso = (time: string) => new Date(`${event.date}T${time}:00+08:00`).toISOString();
    return { ...event, startAt: toIso(event.startTime), endAt: toIso(event.endTime) };
  });
}
