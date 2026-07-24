const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";

export interface User {
  id: string;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
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

export function skipRecommendation(recommendationId: string): Promise<RecommendationStatusResponse> {
  return request<RecommendationStatusResponse>(`/recommendations/${recommendationId}/skip`, {
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

export function formatLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
