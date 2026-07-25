from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

RecommendationStatus = Literal[
    "pending", "accepted", "replaced", "shortened", "skipped", "completed", "partially_completed"
]
Category = Literal["mental", "physical", "nutritional"]
CompletionStatus = Literal["completed", "partially_completed", "skipped"]
FriendshipStatus = Literal["pending", "accepted", "declined"]
FriendRequestDirection = Literal["incoming", "outgoing"]
InvitationStatus = Literal["pending", "accepted", "declined", "cancelled"]


# ============================================================
# USERS
# ============================================================
class User(BaseModel):
    id: UUID
    username: str
    name: str
    email: EmailStr
    experience_level: str | None = None
    primary_goal: str | None = None
    current_location: str | None = None
    carematch_enabled: bool = True
    created_at: datetime


class UserUpdate(BaseModel):
    username: str | None = None
    name: str | None = None
    experience_level: str | None = None
    primary_goal: str | None = None
    current_location: str | None = None
    carematch_enabled: bool | None = None


# ============================================================
# USER_PREFERENCES
# ============================================================
class UserPreferences(BaseModel):
    id: UUID
    user_id: UUID
    preferred_activities: list[str] = Field(default_factory=list)
    disliked_activities: list[str] = Field(default_factory=list)
    friend_match_pref: str | None = None


# ============================================================
# CALENDAR_EVENTS
# ============================================================
class CalendarEvent(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    start_time: datetime
    end_time: datetime
    event_type: str | None = None
    external_event_id: str | None = None
    source: str = "manual"
    last_synced_at: datetime | None = None


class FreeSlot(BaseModel):
    start_time: datetime
    end_time: datetime
    usable_minutes: int


# ============================================================
# Google Calendar sync
# ============================================================
class GoogleSyncRequest(BaseModel):
    user_id: UUID


class GoogleConnectionStatus(BaseModel):
    connected: bool
    connected_at: datetime | None = None
    last_synced_at: datetime | None = None


class GoogleSyncResult(BaseModel):
    synced: int
    removed: int
    last_synced_at: datetime


class FreeSlotItem(BaseModel):
    start_time: datetime
    end_time: datetime
    duration_minutes: int


class FreeSlotsResponse(BaseModel):
    date: str
    source: str
    free_slots: list[FreeSlotItem] = Field(default_factory=list)


# ============================================================
# DAILY_CHECK_INS
# ============================================================
class DailyCheckIn(BaseModel):
    id: UUID
    user_id: UUID
    mood: str | None = None
    energy_level: str | None = None
    physical_readiness: str | None = None
    location: str | None = None
    additional_notes: str | None = None
    created_at: datetime


class DailyCheckInCreate(BaseModel):
    user_id: UUID
    mood: str | None = None
    energy_level: str | None = None
    physical_readiness: str | None = None
    location: str | None = None
    additional_notes: str | None = None


# ============================================================
# ACTIVITY_RECOMMENDATIONS
# ============================================================
class ActivityRecommendation(BaseModel):
    id: UUID
    user_id: UUID
    activity_name: str
    category: Category
    start_time: datetime
    duration_minutes: int
    intensity: str | None = None
    reason: str | None = None
    status: RecommendationStatus = "pending"
    created_at: datetime


# ============================================================
# ACTIVITY_HISTORY
# ============================================================
class ActivityHistory(BaseModel):
    id: UUID
    user_id: UUID
    recommendation_id: UUID | None = None
    completion_status: str | None = None
    feedback: str | None = None
    completed_at: datetime


# ============================================================
# /recommendation-context/{user_id} aggregator response
# ============================================================
class RecentActivity(BaseModel):
    activity_name: str
    category: Category | None = None
    completed_at: datetime
    completion_status: str | None = None


class RecommendationContext(BaseModel):
    """Shaped to match the Foundry agent input context in CLAUDE.md, plus the
    extra profile/history data the frontend needs to render the check-in flow."""

    user_id: UUID
    energy: str | None = None
    mood: str | None = None
    location: str | None = None
    goal: str | None = None
    experience: str | None = None
    recent_activity: str | None = None
    free_period: FreeSlot | None = None

    preferences: UserPreferences | None = None
    latest_check_in: DailyCheckIn | None = None
    upcoming_free_slots: list[FreeSlot] = Field(default_factory=list)
    recent_history: list[RecentActivity] = Field(default_factory=list)


# ============================================================
# POST /recommendations/generate
# ============================================================
class RecommendationGenerateRequest(BaseModel):
    user_id: UUID


class CareMatchInfo(BaseModel):
    available: bool = False
    friend_id: UUID | None = None
    friend_name: str | None = None
    overlap_start: str | None = None
    overlap_end: str | None = None


class RecommendationResponse(BaseModel):
    """Exact contract shape from CLAUDE.md -- this is what the frontend renders."""

    recommendation_id: UUID
    activity: str
    category: Category
    start_time: str  # "HH:MM"
    duration_minutes: int
    intensity: str
    reason: str
    social_compatible: bool = False
    carematch: CareMatchInfo = Field(default_factory=CareMatchInfo)


# ============================================================
# POST /recommendations/{id}/accept | /skip
# ============================================================
class RecommendationStatusResponse(BaseModel):
    recommendation_id: UUID
    status: RecommendationStatus


# ============================================================
# GET /activities/{user_id}/history | POST /activities/{user_id}/result
# ============================================================
class ActivityResultRequest(BaseModel):
    recommendation_id: UUID
    completion_status: CompletionStatus
    feedback: str | None = None


class ActivityHistoryEntry(BaseModel):
    id: UUID
    recommendation_id: UUID | None = None
    activity_name: str | None = None
    category: Category | None = None
    duration_minutes: int | None = None
    intensity: str | None = None
    completion_status: str | None = None
    feedback: str | None = None
    completed_at: datetime


# ============================================================
# CareMatch: friend requests (POST /friends/request, GET /friends/{id},
# GET /friends/{id}/requests, PATCH /friends/requests/{id}/accept|decline)
# ============================================================
class FriendRequestCreate(BaseModel):
    user_id: UUID
    friend_username: str


class FriendshipStatusResponse(BaseModel):
    friendship_id: UUID
    status: FriendshipStatus


class FriendSummary(BaseModel):
    friendship_id: UUID
    user_id: UUID
    username: str
    name: str


class FriendRequestSummary(BaseModel):
    friendship_id: UUID
    user_id: UUID
    username: str
    name: str
    direction: FriendRequestDirection


class FriendsListResponse(BaseModel):
    friends: list[FriendSummary] = Field(default_factory=list)


class FriendRequestsResponse(BaseModel):
    incoming: list[FriendRequestSummary] = Field(default_factory=list)
    outgoing: list[FriendRequestSummary] = Field(default_factory=list)


# ============================================================
# CareMatch: overlap detection (GET /carematch/{user_id}/matches) and
# activity invitations (POST /carematch/invitations, GET
# /carematch/invitations/{user_id}, PATCH .../accept|decline)
# ============================================================
class CareMatchMatch(BaseModel):
    """A friend whose free time today overlaps with the current user's, per
    the deterministic backend overlap calculation (no AI involved)."""

    friend_id: UUID
    username: str
    name: str
    overlap_start: datetime
    overlap_end: datetime
    usable_minutes: int
    suggested_activity: str | None = None
    suggested_category: Category | None = None


class CareMatchMatchesResponse(BaseModel):
    matches: list[CareMatchMatch] = Field(default_factory=list)


class CareMatchInvitationCreate(BaseModel):
    sender_id: UUID
    receiver_id: UUID
    activity_name: str
    proposed_start: datetime
    proposed_end: datetime
    location: str | None = None
    recommendation_id: UUID | None = None


class ActivityInvitation(BaseModel):
    id: UUID
    sender_id: UUID
    sender_name: str
    receiver_id: UUID
    receiver_name: str
    recommendation_id: UUID | None = None
    activity_name: str
    proposed_start: datetime
    proposed_end: datetime
    location: str | None = None
    status: InvitationStatus
    created_at: datetime
    direction: FriendRequestDirection


class CareMatchInvitationsResponse(BaseModel):
    incoming: list[ActivityInvitation] = Field(default_factory=list)
    outgoing: list[ActivityInvitation] = Field(default_factory=list)


class ActivityInvitationStatusResponse(BaseModel):
    invitation_id: UUID
    status: InvitationStatus
