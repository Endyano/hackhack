export type Mood = 'positive' | 'neutral' | 'negative';

export const moodMeta: Record<Mood, { emoji: string; label: string; description: string }> = {
  positive: { emoji: '💪', label: 'Ready to Train', description: 'Your body feels fresh and ready for training.' },
  neutral: { emoji: '🚶', label: 'Steady', description: 'Your body can handle a balanced movement session.' },
  negative: { emoji: '🧘', label: 'Need Recovery', description: 'Your body needs a gentler, recovery-focused session.' },
};

export function getEnergyLabel(energy: number): string {
  if (energy <= 20) return 'Prioritise recovery today 🪫';
  if (energy <= 50) return 'Ready for light movement 🔋';
  if (energy <= 80) return 'Ready for a steady training session ⚡';
  return 'Ready to push your training! 🔥';
}

export function getCheckinRecommendation(mood: Mood, energy: number) {
  if (energy <= 20) {
    return {
      activity: '5-minute recovery mobility',
      intensity: 'Very Light',
      reason: 'Your training readiness is low today. Prioritise mobility, rest, and recovery.',
    };
  }
  if (energy <= 50) {
    return {
      activity: '15-minute recovery walk',
      intensity: 'Light',
      reason: 'A recovery walk supports circulation and keeps your body moving without adding fatigue.',
    };
  }
  if (energy <= 80) {
    return {
      activity: '20-minute aerobic walk',
      intensity: 'Moderate',
      reason: 'Your body is ready for steady aerobic work without overloading your recovery.',
    };
  }
  return {
      activity: '30-minute training session',
    intensity: 'Vigorous',
    reason: 'Your training readiness is high. Make the most of it with a focused workout today.',
  };
}
