import type { Mood } from '../app/Components/AfterLogin/CheckinData';

export type DailyCheckinInput = {
  bodyStatus: Mood;
  readiness: number;
};

export async function saveDailyCheckin(accessToken: string, checkin: DailyCheckinInput) {
  const response = await fetch('/api/checkins', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(checkin),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? 'Check-in request failed.');
  }

  return response.json() as Promise<{ id: string; bodyStatus: Mood; readiness: number; createdAt: string }>;
}
