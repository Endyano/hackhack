'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { demoUsers, type CalendarEntry, type RecommendationState, type InvitationState, type DemoUser } from './DemoData';
import type { Mood } from './AfterLogin/CheckinData';

type DemoStateValue = {
  userId: string;
  currentUser: DemoUser;
  recommendationState: RecommendationState;
  invitationState: InvitationState;
  calendarEntries: CalendarEntry[];
  checkinMood: Mood | null;
  checkinEnergy: number | null;
  setUser: (id: string) => void;
  setRecommendationState: (state: RecommendationState) => void;
  setInvitationState: (state: InvitationState) => void;
  addCalendarEntry: (entry: CalendarEntry) => void;
  setCheckin: (mood: Mood | null, energy: number | null) => void;
};

const DemoStateContext = createContext<DemoStateValue | null>(null);

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState(demoUsers[0].id);
  const [recommendationState, setRecommendationState] = useState<RecommendationState>('pending');
  const [invitationState, setInvitationState] = useState<InvitationState>('pending');
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>(demoUsers[0].calendar);
  const [checkinMood, setCheckinMood] = useState<Mood | null>(null);
  const [checkinEnergy, setCheckinEnergy] = useState<number | null>(null);

  const currentUser = demoUsers.find((user) => user.id === userId) ?? demoUsers[0];

  const setUser = (id: string) => {
    const nextUser = demoUsers.find((user) => user.id === id) ?? demoUsers[0];
    setUserId(nextUser.id);
    setRecommendationState('pending');
    setInvitationState('pending');
    setCalendarEntries(nextUser.calendar);
    setCheckinMood(null);
    setCheckinEnergy(null);
  };

  const addCalendarEntry = (entry: CalendarEntry) => {
    setCalendarEntries((prev) => [...prev, entry]);
  };

  const setCheckin = (mood: Mood | null, energy: number | null) => {
    setCheckinMood(mood);
    setCheckinEnergy(energy);
  };

  return (
    <DemoStateContext.Provider
      value={{
        userId,
        currentUser,
        recommendationState,
        invitationState,
        calendarEntries,
        checkinMood,
        checkinEnergy,
        setUser,
        setRecommendationState,
        setInvitationState,
        addCalendarEntry,
        setCheckin,
      }}
    >
      {children}
    </DemoStateContext.Provider>
  );
}

export function useDemoState() {
  const ctx = useContext(DemoStateContext);
  if (!ctx) {
    throw new Error('useDemoState must be used within a DemoStateProvider');
  }
  return ctx;
}
