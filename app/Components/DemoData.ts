export type RecommendationState = 'pending' | 'accepted' | 'shortened' | 'replaced' | 'skipped';
export type InvitationState = 'none' | 'sent' | 'pending' | 'accepted' | 'declined';

export type CalendarEntry = {
  title: string;
  start: string;
  end: string;
  type: 'class' | 'free' | 'meal' | 'study' | 'activity' | 'match';
  note?: string;
};

export type FreeSlot = { start: string; end: string; usableMinutes: number };

export type CareMatchFriend = {
  id: string;
  name: string;
  freeSlots: FreeSlot[];
};

export type CareMatchInvite = {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  activity: string;
  start: string;
  end: string;
  status: 'pending' | 'accepted' | 'declined';
};

export type DemoUser = {
  id: string;
  name: string;
  mood: string;
  energy: string;
  readiness: string;
  location: string;
  notes: string;
  goal: string;
  recentActivity: string;
  calendar: CalendarEntry[];
  freeSlots: FreeSlot[];
  recommendation: {
    activity: string;
    category: string;
    startTime: string;
    durationMinutes: number;
    intensity: string;
    reason: string;
    socialCompatible: boolean;
    friendName: string;
    overlapStart: string;
    overlapEnd: string;
  };
  history: { activity: string; status: string; date: string }[];
};

export const demoUsers: DemoUser[] = [
  {
    id: 'eric',
    name: 'Eric',
    mood: 'Stressed',
    energy: 'Medium',
    readiness: 'Normal',
    location: 'Campus',
    notes: 'I do not want to sweat before class.',
    goal: 'Improve endurance',
    recentActivity: 'Leg workout yesterday',
    calendar: [
      { title: 'Class', start: '14:00', end: '16:00', type: 'class' },
      { title: 'Free', start: '16:00', end: '18:00', type: 'free' },
      {
        title: '🏃 Easy Run with Daniel',
        start: '16:30',
        end: '17:30',
        type: 'match',
        note: 'Kamu dan Daniel sama-sama free, dan energi Daniel lagi tinggi!',
      },
    ],
    freeSlots: [{ start: '16:00', end: '18:00', usableMinutes: 110 }],
    recommendation: {
      activity: 'Easy run',
      category: 'physical',
      startTime: '16:30',
      durationMinutes: 30,
      intensity: 'Easy',
      reason:
        'You have enough time for a complete session. Because you trained your legs yesterday and your energy is medium, the intensity is kept easy.',
      socialCompatible: true,
      friendName: 'Daniel',
      overlapStart: '16:30',
      overlapEnd: '17:30',
    },
    history: [
      { activity: 'Stretching break', status: 'Completed', date: '24 Jul' },
      { activity: 'Upper-body mobility', status: 'Skipped', date: '23 Jul' },
    ],
  },
  {
    id: 'daniel',
    name: 'Daniel',
    mood: 'Ready',
    energy: 'High',
    readiness: 'Good',
    location: 'Campus Track',
    notes: 'Prefer to run with a friend.',
    goal: 'Stay active',
    recentActivity: 'Rest day yesterday',
    calendar: [
      { title: 'Study', start: '13:00', end: '14:30', type: 'class' },
      { title: 'Free', start: '16:30', end: '18:30', type: 'free' },
      {
        title: '🏃 Easy Run with Eric',
        start: '17:00',
        end: '17:30',
        type: 'match',
        note: 'Kamu dan Eric sama-sama free saat ini.',
      },
    ],
    freeSlots: [{ start: '16:30', end: '18:30', usableMinutes: 120 }],
    recommendation: {
      activity: 'Easy run',
      category: 'physical',
      startTime: '16:30',
      durationMinutes: 30,
      intensity: 'Easy',
      reason:
        'Your energy is high and you are ready to move. This is a good chance to join Eric for a shared run.',
      socialCompatible: true,
      friendName: 'Eric',
      overlapStart: '16:30',
      overlapEnd: '17:30',
    },
    history: [
      { activity: 'Morning yoga', status: 'Completed', date: '24 Jul' },
      { activity: 'Hydration check', status: 'Completed', date: '23 Jul' },
    ],
  },
];

export function formatDate() {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getActiveRecommendation(currentUser: DemoUser, recommendationState: RecommendationState) {
  if (recommendationState === 'shortened') {
    return {
      activity: '20-minute home bodyweight session',
      durationMinutes: 20,
      startTime: '16:40',
      intensity: 'Light',
      reason: 'A shorter session fits the remaining time and keeps the effort easy while still moving your body.',
    };
  }

  if (recommendationState === 'replaced') {
    return {
      activity: 'Mobility routine + breathing break',
      durationMinutes: 20,
      startTime: '16:30',
      intensity: 'Calm',
      reason: 'A lower-impact alternative that still supports your recovery and reduces stress before class.',
    };
  }

  if (recommendationState === 'skipped') {
    return {
      activity: '10-minute walk and hydration break',
      durationMinutes: 10,
      startTime: '16:45',
      intensity: 'Easy',
      reason: 'A simple fallback to keep the flow going even if the original recommendation was skipped.',
    };
  }

  return currentUser.recommendation;
}
