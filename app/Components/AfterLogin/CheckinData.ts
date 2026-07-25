export type Mood = 'positive' | 'neutral' | 'negative';

export const moodMeta: Record<Mood, { emoji: string; label: string; description: string }> = {
  positive: { emoji: '😊', label: 'Feeling good', description: 'Your body feels fresh and ready for training.' },
  neutral: { emoji: '🙂', label: 'Feeling okay', description: 'Your body can handle a balanced movement session.' },
  negative: { emoji: '😔', label: 'Not feeling great', description: 'Your body needs a gentler, recovery-focused session.' },
};

export function getEnergyLabel(energy: number): string {
  if (energy <= 20) return 'Prioritise recovery today 🪫';
  if (energy <= 50) return 'Ready for light movement 🔋';
  if (energy <= 80) return 'Ready for a steady training session ⚡';
  return 'Ready to push your training! 🔥';
}

export function getCheckinRecommendation(mood: Mood, energy: number) {
  if (mood === 'negative') {
    if (energy <= 50) {
      return {
        activity: '10-minute recovery mobility',
        durationMinutes: 10,
        intensity: 'Very Light',
        reason: 'Your body is asking for recovery. Gentle mobility keeps you moving without adding fatigue.',
      };
    }

    return {
      activity: '20-minute easy walk and stretch',
      durationMinutes: 20,
      intensity: 'Light',
      reason: 'You have some energy, but a low-impact session will better support recovery today.',
    };
  }

  if (energy <= 20) {
    return {
      activity: '5-minute recovery mobility',
      durationMinutes: 5,
      intensity: 'Very Light',
      reason: 'Your training readiness is low today. Prioritise mobility, rest, and recovery.',
    };
  }
  if (energy <= 50) {
    return {
      activity: mood === 'positive' ? '15-minute brisk walk' : '15-minute recovery walk',
      durationMinutes: 15,
      intensity: 'Light',
      reason: mood === 'positive'
        ? 'Your mindset is ready, so a brisk walk is a great way to build momentum without overdoing it.'
        : 'A recovery walk supports circulation and keeps your body moving without adding fatigue.',
    };
  }
  if (energy <= 80) {
    return {
      activity: mood === 'positive' ? '25-minute full-body strength circuit' : '20-minute aerobic walk',
      durationMinutes: mood === 'positive' ? 25 : 20,
      intensity: 'Moderate',
      reason: mood === 'positive'
        ? 'Your body and mindset are aligned for a focused, moderate strength session.'
        : 'Your body is ready for steady aerobic work without overloading your recovery.',
    };
  }
  return {
      activity: '30-minute training session',
    durationMinutes: 30,
    intensity: 'Vigorous',
    reason: 'Your training readiness is high. Make the most of it with a focused workout today.',
  };
}
