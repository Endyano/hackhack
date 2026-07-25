import type { Mood } from '../app/Components/AfterLogin/CheckinData';

export type AiRecommendation = { activity: string; durationMinutes: number; intensity: string; reason: string };

export async function generateAiRecommendation(accessToken: string, mood: Mood, energy: number) {
  const response = await fetch('/api/recommendations/generate', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ mood, energy }) });
  const body = await response.json().catch(() => null) as (AiRecommendation & { error?: string }) | null;
  if (!response.ok || !body?.activity) throw new Error(body?.error ?? 'Unable to generate your workout recommendation.');
  return body;
}
