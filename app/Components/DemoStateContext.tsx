'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { demoUsers, type CalendarEntry, type RecommendationState, type InvitationState, type DemoUser } from './DemoData';
import type { Mood } from './AfterLogin/CheckinData';
import {
  listUsers,
  listFriends,
  listFriendRequests,
  sendFriendRequest as sendFriendRequestApi,
  acceptFriendRequest,
  declineFriendRequest,
  updateCareMatchEnabled,
  getCareMatchMatches,
  sendCareMatchInvitation,
  listCareMatchInvitations,
  acceptCareMatchInvitation,
  declineCareMatchInvitation,
  submitCheckIn,
  generateRecommendation,
  acceptRecommendation,
  shortenRecommendation,
  replaceRecommendation,
  skipRecommendation,
  OFFLINE_FALLBACK_RECOMMENDATION,
  ApiError,
  type User as BackendUser,
  type FriendSummary,
  type FriendRequestsResponse,
  type CareMatchMatch,
  type CareMatchInvitationsResponse,
  type RecommendationResponse,
} from '@/lib/api';

export type RecommendationAction = 'accept' | 'shorten' | 'replace' | 'skip';

type DemoStateValue = {
  userId: string;
  currentUser: DemoUser;
  /** The real logged-in user's display name (backend name when resolved,
   *  otherwise a capitalized username) -- use this for greetings instead of
   *  currentUser.name, which is only correct for the Eric/Daniel personas. */
  displayName: string;
  /** Real Supabase UUID for whoever is logged in, resolved from GET /users by
   *  username. Null until resolved, or if the backend is unreachable --
   *  CareMatch calls should treat null as "not connected yet." */
  backendUserId: string | null;
  recommendationState: RecommendationState;
  invitationState: InvitationState;
  calendarEntries: CalendarEntry[];
  /** Real accepted friends for whoever is logged in. */
  connectedFriends: FriendSummary[];
  /** Real pending/resolved friend requests, split by direction. */
  friendRequests: FriendRequestsResponse;
  /** Friends whose free time overlaps with the current user's today,
   *  computed server-side. */
  careMatchMatches: CareMatchMatch[];
  careMatchMatchesLoading: boolean;
  /** Real activity invitations (accept/decline flow), split by direction. */
  careMatchInvitations: CareMatchInvitationsResponse;
  careMatchEnabled: boolean;
  careMatchLoading: boolean;
  checkinMood: Mood | null;
  checkinEnergy: number | null;
  /** Real AI recommendation from POST /recommendations/generate for whoever
   *  is logged in, or the offline fallback if the backend/Foundry call
   *  failed. Null until the user has completed a check-in this session. */
  liveRecommendation: RecommendationResponse | null;
  recommendationLoading: boolean;
  setUser: (id: string) => void;
  setRecommendationState: (state: RecommendationState) => void;
  setInvitationState: (state: InvitationState) => void;
  addCalendarEntry: (entry: CalendarEntry) => void;
  /** Submits the check-in form to the backend for `username` and requests a
   *  real Foundry recommendation. Always resolves ok:true -- on any backend
   *  failure it falls back to OFFLINE_FALLBACK_RECOMMENDATION instead of
   *  surfacing an error, per CLAUDE.md's "demo must never visibly break" rule. */
  submitCheckInAndGenerate: (username: string, mood: Mood, energyPercent: number) => Promise<{ ok: boolean }>;
  /** Accept/shorten/replace/skip the current liveRecommendation via the real
   *  backend endpoints. Falls back to flipping local cosmetic state when
   *  there's no real recommendation to act on (offline fallback / pre-checkin demo). */
  applyRecommendationAction: (action: RecommendationAction) => Promise<void>;
  /** Sends a real friend request by username -- like any normal "add friend"
   *  flow. Returns an error message on failure so the form can show it. */
  sendFriendRequestByUsername: (username: string) => Promise<{ ok: boolean; error?: string }>;
  respondToFriendRequest: (friendshipId: string, action: 'accept' | 'decline') => Promise<void>;
  /** Sends a real invitation for the given overlap match. */
  sendCareMatchInvite: (match: CareMatchMatch) => Promise<{ ok: boolean; error?: string }>;
  respondToCareMatchInvite: (invitationId: string, action: 'accept' | 'decline') => Promise<void>;
  toggleCareMatchEnabled: (enabled: boolean) => Promise<void>;
  setCheckin: (mood: Mood | null, energy: number | null) => void;
};

const DemoStateContext = createContext<DemoStateValue | null>(null);

const EMPTY_REQUESTS: FriendRequestsResponse = { incoming: [], outgoing: [] };
const EMPTY_INVITATIONS: CareMatchInvitationsResponse = { incoming: [], outgoing: [] };

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState(demoUsers[0].id);
  const [recommendationState, setRecommendationState] = useState<RecommendationState>('pending');
  const [invitationState, setInvitationState] = useState<InvitationState>('pending');
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>(demoUsers[0].calendar);
  const [checkinMood, setCheckinMood] = useState<Mood | null>(null);
  const [checkinEnergy, setCheckinEnergy] = useState<number | null>(null);
  const [liveRecommendation, setLiveRecommendation] = useState<RecommendationResponse | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  const [backendUsers, setBackendUsers] = useState<BackendUser[]>([]);
  const [connectedFriends, setConnectedFriends] = useState<FriendSummary[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestsResponse>(EMPTY_REQUESTS);
  const [careMatchMatches, setCareMatchMatches] = useState<CareMatchMatch[]>([]);
  const [careMatchMatchesLoading, setCareMatchMatchesLoading] = useState(false);
  const [careMatchInvitations, setCareMatchInvitations] = useState<CareMatchInvitationsResponse>(EMPTY_INVITATIONS);
  const [careMatchLoading, setCareMatchLoading] = useState(false);

  useEffect(() => {
    listUsers()
      .then(setBackendUsers)
      .catch(() => {
        // Backend unreachable -- CareMatch features stay empty/disabled,
        // the rest of the (local) demo still works.
        setBackendUsers([]);
      });
  }, []);

  // Cosmetic dashboard/check-in persona: falls back to the first local demo
  // user (Eric) when the logged-in username isn't one of the two hand-authored
  // personas -- e.g. logging in as one of the other seeded backend accounts.
  const currentUser = demoUsers.find((user) => user.id === userId) ?? demoUsers[0];

  // Real identity: resolved by matching the login username against the
  // actual backend user list, independent of the cosmetic persona above --
  // this is what makes every seeded account usable for CareMatch.
  const backendUser = backendUsers.find((user) => user.username.toLowerCase() === userId.toLowerCase());
  const backendUserId = backendUser?.id ?? null;
  const careMatchEnabled = backendUser?.carematch_enabled ?? true;

  // The name actually shown in greetings etc. Prefers the real backend
  // user's name (so e.g. logging in as "nova" greets "Nova", not the
  // cosmetic Eric/Daniel fallback persona's name); falls back to a
  // capitalized version of the raw username, and only uses the cosmetic
  // persona's name for the two hand-authored demo users.
  const isKnownPersona = demoUsers.some((user) => user.id === userId.toLowerCase());
  const displayName =
    backendUser?.name ?? (isKnownPersona ? currentUser.name : userId ? userId.charAt(0).toUpperCase() + userId.slice(1) : currentUser.name);

  const refreshFriends = async (forUserId: string) => {
    try {
      const { friends } = await listFriends(forUserId);
      setConnectedFriends(friends);
    } catch {
      setConnectedFriends([]);
    }
  };

  const refreshFriendRequests = async (forUserId: string) => {
    try {
      setFriendRequests(await listFriendRequests(forUserId));
    } catch {
      setFriendRequests(EMPTY_REQUESTS);
    }
  };

  const refreshCareMatchMatches = async (forUserId: string) => {
    setCareMatchMatchesLoading(true);
    try {
      const { matches } = await getCareMatchMatches(forUserId);
      setCareMatchMatches(matches);
    } catch {
      setCareMatchMatches([]);
    } finally {
      setCareMatchMatchesLoading(false);
    }
  };

  const refreshCareMatchInvitations = async (forUserId: string) => {
    try {
      setCareMatchInvitations(await listCareMatchInvitations(forUserId));
    } catch {
      setCareMatchInvitations(EMPTY_INVITATIONS);
    }
  };

  useEffect(() => {
    if (!backendUserId) {
      setConnectedFriends([]);
      setFriendRequests(EMPTY_REQUESTS);
      setCareMatchMatches([]);
      setCareMatchInvitations(EMPTY_INVITATIONS);
      return;
    }
    Promise.resolve().then(() => refreshFriends(backendUserId)).catch(() => {});
    Promise.resolve().then(() => refreshFriendRequests(backendUserId)).catch(() => {});
    Promise.resolve().then(() => refreshCareMatchMatches(backendUserId)).catch(() => {});
    Promise.resolve().then(() => refreshCareMatchInvitations(backendUserId)).catch(() => {});
  }, [backendUserId]);

  const setUser = (id: string) => {
    // Store the raw login identity (not the cosmetic fallback) so unknown
    // usernames still resolve correctly against the real backend user list.
    const nextUser = demoUsers.find((user) => user.id === id) ?? demoUsers[0];
    setUserId(id || nextUser.id);
    setRecommendationState('pending');
    setInvitationState('pending');
    setCalendarEntries(nextUser.calendar);
    setCheckinMood(null);
    setCheckinEnergy(null);
    setLiveRecommendation(null);
  };

  const addCalendarEntry = (entry: CalendarEntry) => {
    setCalendarEntries((prev) => [...prev, entry]);
  };

  const sendFriendRequestByUsername = async (username: string): Promise<{ ok: boolean; error?: string }> => {
    if (!backendUserId) return { ok: false, error: 'Not connected to the server yet -- try again in a moment.' };
    try {
      await sendFriendRequestApi(backendUserId, username);
      await refreshFriendRequests(backendUserId);
      return { ok: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not send friend request.';
      return { ok: false, error: message };
    }
  };

  const respondToFriendRequest = async (friendshipId: string, action: 'accept' | 'decline') => {
    if (!backendUserId) return;
    setCareMatchLoading(true);
    try {
      if (action === 'accept') {
        await acceptFriendRequest(friendshipId);
      } else {
        await declineFriendRequest(friendshipId);
      }
      await Promise.all([
        refreshFriendRequests(backendUserId),
        refreshFriends(backendUserId),
        refreshCareMatchMatches(backendUserId),
      ]);
    } finally {
      setCareMatchLoading(false);
    }
  };

  const sendCareMatchInvite = async (match: CareMatchMatch): Promise<{ ok: boolean; error?: string }> => {
    if (!backendUserId) return { ok: false, error: 'Not connected to the server yet -- try again in a moment.' };
    try {
      await sendCareMatchInvitation({
        sender_id: backendUserId,
        receiver_id: match.friend_id,
        activity_name: match.suggested_activity ?? 'Activity together',
        proposed_start: match.overlap_start,
        proposed_end: match.overlap_end,
      });
      await refreshCareMatchInvitations(backendUserId);
      setInvitationState('sent');
      return { ok: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not send invitation.';
      return { ok: false, error: message };
    }
  };

  const respondToCareMatchInvite = async (invitationId: string, action: 'accept' | 'decline') => {
    if (!backendUserId) return;
    try {
      if (action === 'accept') {
        await acceptCareMatchInvitation(invitationId);
      } else {
        await declineCareMatchInvitation(invitationId);
      }
      await refreshCareMatchInvitations(backendUserId);
      setInvitationState(action === 'accept' ? 'accepted' : 'declined');
    } catch {
      // Non-fatal -- invitations list stays as last known good state.
    }
  };

  const toggleCareMatchEnabled = async (enabled: boolean) => {
    if (!backendUserId) return;
    setCareMatchLoading(true);
    try {
      const updated = await updateCareMatchEnabled(backendUserId, enabled);
      setBackendUsers((previous) => previous.map((user) => (user.id === updated.id ? updated : user)));
    } finally {
      setCareMatchLoading(false);
    }
  };

  const setCheckin = (mood: Mood | null, energy: number | null) => {
    setCheckinMood(mood);
    setCheckinEnergy(energy);
  };

  const submitCheckInAndGenerate = async (
    username: string,
    mood: Mood,
    energyPercent: number,
  ): Promise<{ ok: boolean }> => {
    // Sync the cosmetic persona + reset per-user state first so the right
    // user is showing while the request is in flight.
    setUser(username);
    setCheckin(mood, energyPercent);
    setRecommendationLoading(true);
    try {
      // backendUsers may not have loaded yet if the user blitzed through the
      // login -> mood -> energy screens; give it one more try before falling back.
      let resolved = backendUsers.find((user) => user.username.toLowerCase() === username.toLowerCase());
      if (!resolved) {
        try {
          const users = await listUsers();
          setBackendUsers(users);
          resolved = users.find((user) => user.username.toLowerCase() === username.toLowerCase());
        } catch {
          resolved = undefined;
        }
      }
      if (!resolved) {
        setLiveRecommendation(OFFLINE_FALLBACK_RECOMMENDATION);
        return { ok: true };
      }
      await submitCheckIn({ user_id: resolved.id, mood, energy_level: String(energyPercent) });
      const rec = await generateRecommendation(resolved.id);
      setLiveRecommendation(rec);
      return { ok: true };
    } catch {
      // Backend unreachable or Foundry failed -- never show a broken demo.
      setLiveRecommendation(OFFLINE_FALLBACK_RECOMMENDATION);
      return { ok: true };
    } finally {
      setRecommendationLoading(false);
    }
  };

  const applyRecommendationAction = async (action: RecommendationAction) => {
    const stateForAction: RecommendationState =
      action === 'accept' ? 'accepted' : action === 'shorten' ? 'shortened' : action === 'replace' ? 'replaced' : 'skipped';

    if (!liveRecommendation || liveRecommendation.recommendation_id === OFFLINE_FALLBACK_RECOMMENDATION.recommendation_id) {
      // No real recommendation to act on (offline fallback, or the seeded
      // pre-checkin demo state) -- just flip the cosmetic state.
      setRecommendationState(stateForAction);
      return;
    }

    setRecommendationLoading(true);
    try {
      if (action === 'accept') {
        await acceptRecommendation(liveRecommendation.recommendation_id);
      } else {
        const apiFn = action === 'shorten' ? shortenRecommendation : action === 'replace' ? replaceRecommendation : skipRecommendation;
        const next = await apiFn(liveRecommendation.recommendation_id);
        setLiveRecommendation(next);
      }
      setRecommendationState(stateForAction);
    } catch {
      // Leave state as-is; the button just won't visibly update this time.
    } finally {
      setRecommendationLoading(false);
    }
  };

  return (
    <DemoStateContext.Provider
      value={{
        userId,
        currentUser,
        displayName,
        backendUserId,
        recommendationState,
        invitationState,
        calendarEntries,
        connectedFriends,
        friendRequests,
        careMatchMatches,
        careMatchMatchesLoading,
        careMatchInvitations,
        careMatchEnabled,
        careMatchLoading,
        checkinMood,
        checkinEnergy,
        liveRecommendation,
        recommendationLoading,
        setUser,
        setRecommendationState,
        setInvitationState,
        addCalendarEntry,
        submitCheckInAndGenerate,
        applyRecommendationAction,
        sendFriendRequestByUsername,
        respondToFriendRequest,
        sendCareMatchInvite,
        respondToCareMatchInvite,
        toggleCareMatchEnabled,
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
