'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  demoUsers,
  type CalendarEntry,
  type RecommendationState,
  type InvitationState,
  type DemoUser,
  type CareMatchFriend,
  type CareMatchInvite,
} from './DemoData';
import type { Mood } from './AfterLogin/CheckinData';

type DemoStateValue = {
  userId: string;
  currentUser: DemoUser;
  recommendationState: RecommendationState;
  invitationState: InvitationState;
  calendarEntries: CalendarEntry[];
  friends: CareMatchFriend[];
  careMatchInvites: CareMatchInvite[];
  checkinMood: Mood | null;
  checkinEnergy: number | null;
  setUser: (id: string) => void;
  setRecommendationState: (state: RecommendationState) => void;
  setInvitationState: (state: InvitationState) => void;
  addCalendarEntry: (entry: CalendarEntry) => void;
  addFriend: (name: string) => void;
  sendCareMatchInvite: (friend: CareMatchFriend, activity: string, start: string, end: string) => void;
  respondToCareMatchInvite: (inviteId: string, status: 'accepted' | 'declined') => void;
  setCheckin: (mood: Mood | null, energy: number | null) => void;
};

const DemoStateContext = createContext<DemoStateValue | null>(null);

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState(demoUsers[0].id);
  const [recommendationState, setRecommendationState] = useState<RecommendationState>('pending');
  const [invitationState, setInvitationState] = useState<InvitationState>('pending');
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>(demoUsers[0].calendar);
  const [friendsByUser, setFriendsByUser] = useState<Record<string, CareMatchFriend[]>>(() =>
    Object.fromEntries(
      demoUsers.map((user) => {
        const buddy = demoUsers.find((candidate) => candidate.id !== user.id);
        return [user.id, buddy ? [{ id: buddy.id, name: buddy.name, freeSlots: buddy.freeSlots }] : []];
      }),
    ),
  );
  const [careMatchInvites, setCareMatchInvites] = useState<CareMatchInvite[]>([]);
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

  const friends = friendsByUser[userId] ?? [];

  const addFriend = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName || friends.some((friend) => friend.name.toLowerCase() === trimmedName.toLowerCase())) return;

    const id = `friend-${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    setFriendsByUser((previous) => ({
      ...previous,
      [userId]: [
        ...(previous[userId] ?? []),
        // Demo availability represents a synced friend calendar.
        { id, name: trimmedName, freeSlots: [{ start: '16:30', end: '18:00', usableMinutes: 90 }] },
      ],
    }));
  };

  const sendCareMatchInvite = (friend: CareMatchFriend, activity: string, start: string, end: string) => {
    setCareMatchInvites((previous) => [
      ...previous,
      {
        id: `${userId}-${friend.id}-${Date.now()}`,
        fromId: userId,
        fromName: currentUser.name,
        toId: friend.id,
        toName: friend.name,
        activity,
        start,
        end,
        status: 'pending',
      },
    ]);
    setInvitationState('sent');
  };

  const respondToCareMatchInvite = (inviteId: string, status: 'accepted' | 'declined') => {
    setCareMatchInvites((previous) => previous.map((invite) => (invite.id === inviteId ? { ...invite, status } : invite)));
    setInvitationState(status);
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
        friends,
        careMatchInvites,
        checkinMood,
        checkinEnergy,
        setUser,
        setRecommendationState,
        setInvitationState,
        addCalendarEntry,
        addFriend,
        sendCareMatchInvite,
        respondToCareMatchInvite,
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
