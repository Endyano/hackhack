export type CalendarEventInput = {
  title: string;
  startAt: string;
  endAt: string;
  type: 'training' | 'mobility' | 'recovery' | 'social';
  note?: string;
};

export type StoredCalendarEvent = CalendarEventInput & {
  id: string;
};

async function requestCalendarEvents<T>(accessToken: string, path = '', options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/calendar-events${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? 'Calendar request failed.');
  }

  return response.json() as Promise<T>;
}

export function getCalendarEvents(accessToken: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.size ? `?${params.toString()}` : '';
  return requestCalendarEvents<StoredCalendarEvent[]>(accessToken, query);
}

export function createCalendarEvent(accessToken: string, event: CalendarEventInput) {
  return requestCalendarEvents<StoredCalendarEvent>(accessToken, '', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export function clearCalendarEvents(accessToken: string) {
  return requestCalendarEvents<{ ok: boolean }>(accessToken, '', { method: 'DELETE' });
}
