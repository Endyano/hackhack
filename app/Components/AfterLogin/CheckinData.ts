export type Mood = 'positive' | 'neutral' | 'negative';

export const moodMeta: Record<Mood, { emoji: string; label: string; description: string }> = {
  positive: { emoji: '😊', label: 'Feeling Good', description: 'Energised and ready to take on the day.' },
  neutral: { emoji: '😐', label: 'Feeling Okay', description: 'Steady — neither high nor low today.' },
  negative: { emoji: '😔', label: 'Not Feeling Great', description: "Low energy or mood — let's keep it gentle." },
};

export function getEnergyLabel(energy: number): string {
  if (energy <= 20) return 'Take it easy today 🪫';
  if (energy <= 50) return 'You have some energy to work with 🔋';
  if (energy <= 80) return "You're feeling energised today ⚡";
  return "You're ready to move! 🔥";
}

export function getCheckinRecommendation(mood: Mood, energy: number) {
  if (energy <= 20) {
    return {
      activity: '5-minute stretch & rest',
      intensity: 'Very Light',
      reason: 'Your energy is low today. Take it easy and focus on rest and recovery.',
    };
  }
  if (energy <= 50) {
    return {
      activity: '15-minute gentle walk',
      intensity: 'Light',
      reason: 'You have some energy to work with. A gentle walk keeps you active without draining you.',
    };
  }
  if (energy <= 80) {
    return {
      activity: '20-minute outdoor walk',
      intensity: 'Moderate',
      reason: 'You have good energy today. A short walk can help you stay active without overdoing it.',
    };
  }
  return {
    activity: '30-minute workout or run',
    intensity: 'Vigorous',
    reason: "You're ready to move! Make the most of your energy with a full workout today.",
  };
}
