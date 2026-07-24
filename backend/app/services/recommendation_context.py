from datetime import date as date_cls, datetime, time
from uuid import UUID

from fastapi import HTTPException

from app.models.schemas import (
    DailyCheckIn,
    RecentActivity,
    RecommendationContext,
    UserPreferences,
)
from app.services.calendar import day_bounds, fetch_events
from app.services.free_slots import compute_free_slots
from app.services.supabase_client import get_supabase

RECENT_HISTORY_LIMIT = 5


def _relative_day_label(when: datetime) -> str:
    delta_days = (datetime.now(when.tzinfo).date() - when.date()).days
    if delta_days <= 0:
        return "today"
    if delta_days == 1:
        return "yesterday"
    return f"{delta_days} days ago"


def build_recommendation_context(user_id: UUID) -> RecommendationContext:
    supabase = get_supabase()

    user_result = supabase.table("users").select("*").eq("id", str(user_id)).maybe_single().execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")
    user = user_result.data

    prefs_result = (
        supabase.table("user_preferences")
        .select("*")
        .eq("user_id", str(user_id))
        .maybe_single()
        .execute()
    )
    preferences = UserPreferences.model_validate(prefs_result.data) if prefs_result.data else None

    check_in_result = (
        supabase.table("daily_check_ins")
        .select("*")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    latest_check_in = (
        DailyCheckIn.model_validate(check_in_result.data[0]) if check_in_result.data else None
    )

    today = date_cls.today()
    day_start, day_end = day_bounds(today, time(7, 0), time(23, 0))
    events = fetch_events(user_id, day_start, day_end)
    free_slots = compute_free_slots(events, day_start=day_start, day_end=day_end)

    now = datetime.now(day_start.tzinfo)
    current_or_next_slot = next((slot for slot in free_slots if slot.end_time > now), None)

    history_result = (
        supabase.table("activity_history")
        .select("*, activity_recommendations(activity_name, category)")
        .eq("user_id", str(user_id))
        .order("completed_at", desc=True)
        .limit(RECENT_HISTORY_LIMIT)
        .execute()
    )
    recent_history: list[RecentActivity] = []
    for row in history_result.data or []:
        joined = row.get("activity_recommendations") or {}
        activity_name = joined.get("activity_name") or "activity"
        recent_history.append(
            RecentActivity(
                activity_name=activity_name,
                category=joined.get("category"),
                completed_at=row["completed_at"],
                completion_status=row.get("completion_status"),
            )
        )

    recent_activity_summary = None
    if recent_history:
        top = recent_history[0]
        recent_activity_summary = f"{top.activity_name} {_relative_day_label(top.completed_at)}"

    return RecommendationContext(
        user_id=user_id,
        energy=latest_check_in.energy_level if latest_check_in else None,
        mood=latest_check_in.mood if latest_check_in else None,
        location=(latest_check_in.location if latest_check_in else None) or user.get("current_location"),
        goal=user.get("primary_goal"),
        experience=user.get("experience_level"),
        recent_activity=recent_activity_summary,
        free_period=current_or_next_slot,
        preferences=preferences,
        latest_check_in=latest_check_in,
        upcoming_free_slots=free_slots,
        recent_history=recent_history,
    )
