const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  experience_level: string | null;
  primary_goal: string | null;
  current_location: string | null;
  carematch_enabled: boolean;
  created_at: string;
}

export interface FreeSlot {
  start_time: string;
  end_time: string;
  usable_minutes: number;
}

export interface DailyCheckIn {
  id: string;
  user_id: string;
  mood: string | null;
  energy_level: string | null;
  physical_readiness: string | null;
  location: string | null;
  additional_notes: string | null;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_activities: string[];
  disliked_activities: string[];
  friend_match_pref: string | null;
}

export interface RecentActivity {
  activity_name: string;
  category: string | null;
  completed_at: string;
  completion_status: string | null;
}

export interface RecommendationContext {
  user_id: string;
  energy: string | null;
  mood: string | null;
  location: string | null;
  goal: string | null;
  experience: string | null;
  recent_activity: string | null;
  free_period: FreeSlot | null;
  preferences: UserPreferences | null;
  latest_check_in: DailyCheckIn | null;
  upcoming_free_slots: FreeSlot[];
  recent_history: RecentActivity[];
}

export type Category = "mental" | "physical" | "nutritional";

export interface CareMatchInfo {
  available: boolean;
  friend_id: string | null;
  friend_name: string | null;
  overlap_start: string | null;
  overlap_end: string | null;
}

export interface RecommendationResponse {
  recommendation_id: string;
  activity: string;
  category: Category;
  start_time: string;
  duration_minutes: number;
  intensity: string;
  reason: string;
  social_compatible: boolean;
  carematch: CareMatchInfo;
}

export interface CheckInPayload {
  user_id: string;
  mood?: string;
  energy_level?: string;
  physical_readiness?: string;
  location?: string;
  additional_notes?: string;
}

export type RecommendationStatus =
  | "pending"
  | "accepted"
  | "replaced"
  | "shortened"
  | "skipped"
  | "completed"
  | "partially_completed";

export interface RecommendationStatusResponse {
  recommendation_id: string;
  status: RecommendationStatus;
}

export type CompletionStatus = "completed" | "partially_completed" | "skipped";

export interface ActivityResultPayload {
  recommendation_id: string;
  completion_status: CompletionStatus;
  feedback?: string;
}

export interface ActivityHistoryEntry {
  id: string;
  recommendation_id: string | null;
  activity_name: string | null;
  category: Category | null;
  duration_minutes: number | null;
  intensity: string | null;
  completion_status: string | null;
  feedback: string | null;
  completed_at: string;
}

// Shown whenever the backend is unreachable at all (network failure). If the
// backend *is* reachable but the Foundry call itself fails, the backend
// already returns this same fallback shape from /recommendations/generate --
// this constant only covers the "can't even reach our API" case, per
// CLAUDE.md's rule that the demo must never show a visible error state.
export const OFFLINE_FALLBACK_RECOMMENDATION: RecommendationResponse = {
  recommendation_id: "offline-fallback",
  activity: "10-minute walk and hydration break",
  category: "physical",
  start_time: "--:--",
  duration_minutes: 10,
  intensity: "easy",
  reason: "We couldn't reach the CareShift server right now, so here's a safe default to keep you moving.",
  social_compatible: false,
  carematch: {
    available: false,
    friend_id: null,
    friend_name: null,
    overlap_start: null,
    overlap_end: null,
  },
};

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    // Backend returns {"error": "CODE", "message": "..."} -- surface that
    // directly so forms can show a real reason instead of a generic failure.
    const body = await res.json().catch(() => null);
    if (body && typeof body.error === "string" && typeof body.message === "string") {
      throw new ApiError(res.status, body.error, body.message);
    }
    throw new ApiError(res.status, "UNKNOWN_ERROR", `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function listUsers(): Promise<User[]> {
  return request<User[]>("/users");
}

export function getRecommendationContext(userId: string): Promise<RecommendationContext> {
  return request<RecommendationContext>(`/recommendation-context/${userId}`);
}

export function submitCheckIn(payload: CheckInPayload): Promise<DailyCheckIn> {
  return request<DailyCheckIn>("/check-ins", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function generateRecommendation(userId: string): Promise<RecommendationResponse> {
  return request<RecommendationResponse>("/recommendations/generate", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export function acceptRecommendation(recommendationId: string): Promise<RecommendationStatusResponse> {
  return request<RecommendationStatusResponse>(`/recommendations/${recommendationId}/accept`, {
    method: "POST",
  });
}

export function skipRecommendation(recommendationId: string): Promise<RecommendationResponse> {
  return request<RecommendationResponse>(`/recommendations/${recommendationId}/skip`, {
    method: "POST",
  });
}

export function shortenRecommendation(recommendationId: string): Promise<RecommendationResponse> {
  return request<RecommendationResponse>(`/recommendations/${recommendationId}/shorten`, {
    method: "POST",
  });
}

export function replaceRecommendation(recommendationId: string): Promise<RecommendationResponse> {
  return request<RecommendationResponse>(`/recommendations/${recommendationId}/replace`, {
    method: "POST",
  });
}

export function reportActivityResult(
  userId: string,
  payload: ActivityResultPayload
): Promise<ActivityHistoryEntry> {
  return request<ActivityHistoryEntry>(`/activities/${userId}/result`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getActivityHistory(userId: string): Promise<ActivityHistoryEntry[]> {
  return request<ActivityHistoryEntry[]>(`/activities/${userId}/history`);
}

export function updateCareMatchEnabled(userId: string, enabled: boolean): Promise<User> {
  return request<User>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ carematch_enabled: enabled }),
  });
}

export type FriendshipStatus = "pending" | "accepted" | "declined";

export interface FriendshipStatusResponse {
  friendship_id: string;
  status: FriendshipStatus;
}

export interface FriendSummary {
  friendship_id: string;
  user_id: string;
  username: string;
  name: string;
}

export interface FriendRequestSummary extends FriendSummary {
  direction: "incoming" | "outgoing";
}

export interface FriendsListResponse {
  friends: FriendSummary[];
}

export interface FriendRequestsResponse {
  incoming: FriendRequestSummary[];
  outgoing: FriendRequestSummary[];
}

export function sendFriendRequest(userId: string, friendUsername: string): Promise<FriendshipStatusResponse> {
  return request<FriendshipStatusResponse>("/friends/request", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, friend_username: friendUsername }),
  });
}

export function listFriends(userId: string): Promise<FriendsListResponse> {
  return request<FriendsListResponse>(`/friends/${userId}`);
}

export function listFriendRequests(userId: string): Promise<FriendRequestsResponse> {
  return request<FriendRequestsResponse>(`/friends/${userId}/requests`);
}

export function acceptFriendRequest(friendshipId: string): Promise<FriendshipStatusResponse> {
  return request<FriendshipStatusResponse>(`/friends/requests/${friendshipId}/accept`, {
    method: "PATCH",
  });
}

export function declineFriendRequest(friendshipId: string): Promise<FriendshipStatusResponse> {
  return request<FriendshipStatusResponse>(`/friends/requests/${friendshipId}/decline`, {
    method: "PATCH",
  });
}

export function formatLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ============================================================
// CareMatch: overlap matches + activity invitations
// ============================================================
export interface CareMatchMatch {
  friend_id: string;
  username: string;
  name: string;
  overlap_start: string;
  overlap_end: string;
  usable_minutes: number;
  suggested_activity: string | null;
  suggested_category: Category | null;
}

export interface CareMatchMatchesResponse {
  matches: CareMatchMatch[];
}

export type InvitationStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface ActivityInvitation {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  receiver_name: string;
  recommendation_id: string | null;
  activity_name: string;
  proposed_start: string;
  proposed_end: string;
  location: string | null;
  status: InvitationStatus;
  created_at: string;
  direction: "incoming" | "outgoing";
}

export interface CareMatchInvitationsResponse {
  incoming: ActivityInvitation[];
  outgoing: ActivityInvitation[];
}

export interface ActivityInvitationStatusResponse {
  invitation_id: string;
  status: InvitationStatus;
}

export interface CareMatchInvitationPayload {
  sender_id: string;
  receiver_id: string;
  activity_name: string;
  proposed_start: string;
  proposed_end: string;
  location?: string;
  recommendation_id?: string;
}

export function getCareMatchMatches(userId: string): Promise<CareMatchMatchesResponse> {
  return request<CareMatchMatchesResponse>(`/carematch/${userId}/matches`);
}

export function sendCareMatchInvitation(payload: CareMatchInvitationPayload): Promise<ActivityInvitation> {
  return request<ActivityInvitation>("/carematch/invitations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listCareMatchInvitations(userId: string): Promise<CareMatchInvitationsResponse> {
  return request<CareMatchInvitationsResponse>(`/carematch/invitations/${userId}`);
}

export function acceptCareMatchInvitation(invitationId: string): Promise<ActivityInvitationStatusResponse> {
  return request<ActivityInvitationStatusResponse>(`/carematch/invitations/${invitationId}/accept`, {
    method: "PATCH",
  });
}

export function declineCareMatchInvitation(invitationId: string): Promise<ActivityInvitationStatusResponse> {
  return request<ActivityInvitationStatusResponse>(`/carematch/invitations/${invitationId}/decline`, {
    method: "PATCH",
  });
}
