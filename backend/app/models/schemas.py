from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

RecommendationStatus = Literal[
    "pending", "accepted", "replaced", "shortened", "skipped", "completed", "partially_completed"
]
InvitationStatus = Literal["pending", "accepted", "declined", "cancelled"]
FriendshipStatus = Literal["pending", "accepted", "declined"]
Category = Literal["mental", "physical", "nutritional"]
CompletionStatus = Literal["completed", "partially_completed", "skipped"]


# ============================================================
# USERS
# ============================================================
class User(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    experience_level: str | None = None
    primary_goal: str | None = None
    current_location: str | None = None
    carematch_enabled: bool = True
    created_at: datetime


class UserUpdate(BaseModel):
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


class FreeSlot(BaseModel):
    start_time: datetime
    end_time: datetime
    usable_minutes: int


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
# FRIENDSHIPS
# ============================================================
class Friendship(BaseModel):
    id: UUID
    user_id: UUID
    friend_id: UUID
    status: FriendshipStatus = "pending"
    carematch_enabled: bool = True


# ============================================================
# ACTIVITY_INVITATIONS
# ============================================================
class ActivityInvitation(BaseModel):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    recommendation_id: UUID | None = None
    activity_name: str
    proposed_start: datetime
    proposed_end: datetime
    location: str | None = None
    status: InvitationStatus = "pending"
    created_at: datetime


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
