"""Deterministic CareMatch overlap detection: for a user's accepted,
carematch-enabled friends, find today's free-slot overlap using the same
free-slot logic as a single user's calendar. No AI involved -- CLAUDE.md
puts "overlap calculation for CareMatch" squarely in backend-rules territory;
Foundry only ever gets asked to flag social-compatibility on top of this."""

from __future__ import annotations

from datetime import date as date_cls, datetime
from uuid import UUID

from app.models.schemas import CareMatchMatch, FreeSlot
from app.services.calendar import day_bounds, fetch_events
from app.services.free_slots import compute_free_slots
from app.services.supabase_client import get_supabase


def _carematch_friends(user_id: UUID) -> list[dict]:
    """Friends with an accepted, carematch-enabled friendship who also have
    carematch enabled on their own account."""
    supabase = get_supabase()
    friendships = (
        supabase.table("friendships")
        .select("*")
        .or_(f"user_id.eq.{user_id},friend_id.eq.{user_id}")
        .eq("status", "accepted")
        .eq("carematch_enabled", True)
        .execute()
    )
    rows = friendships.data or []
    friend_ids = list(
        {row["friend_id"] if row["user_id"] == str(user_id) else row["user_id"] for row in rows}
    )
    if not friend_ids:
        return []

    users_result = (
        supabase.table("users")
        .select("id, username, name, carematch_enabled")
        .in_("id", friend_ids)
        .eq("carematch_enabled", True)
        .execute()
    )
    return users_result.data or []


def _best_overlap(a: list[FreeSlot], b: list[FreeSlot]) -> tuple[datetime, datetime] | None:
    best: tuple[datetime, datetime] | None = None
    for slot_a in a:
        for slot_b in b:
            start = max(slot_a.start_time, slot_b.start_time)
            end = min(slot_a.end_time, slot_b.end_time)
            if start >= end:
                continue
            if best is None or (end - start) > (best[1] - best[0]):
                best = (start, end)
    return best


def _latest_activity(user_id: UUID) -> tuple[str | None, str | None]:
    """Most recent recommendation for this user, used to prefill the invite
    suggestion (e.g. "invite Daniel to your Easy run")."""
    supabase = get_supabase()
    result = (
        supabase.table("activity_recommendations")
        .select("activity_name, category")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    if not rows:
        return None, None
    return rows[0]["activity_name"], rows[0]["category"]


def find_matches(user_id: UUID, target_date: date_cls | None = None) -> list[CareMatchMatch]:
    supabase = get_supabase()
    user_result = (
        supabase.table("users").select("carematch_enabled").eq("id", str(user_id)).maybe_single().execute()
    )
    if not user_result or not user_result.data or not user_result.data.get("carematch_enabled"):
        return []

    target_date = target_date or date_cls.today()
    day_start, day_end = day_bounds(target_date)
    user_slots = compute_free_slots(fetch_events(user_id, day_start, day_end), day_start, day_end)
    if not user_slots:
        return []

    suggested_activity, suggested_category = _latest_activity(user_id)

    matches: list[CareMatchMatch] = []
    for friend in _carematch_friends(user_id):
        friend_id = UUID(friend["id"])
        friend_slots = compute_free_slots(fetch_events(friend_id, day_start, day_end), day_start, day_end)
        overlap = _best_overlap(user_slots, friend_slots)
        if overlap is None:
            continue
        start, end = overlap
        matches.append(
            CareMatchMatch(
                friend_id=friend_id,
                username=friend["username"],
                name=friend["name"],
                overlap_start=start,
                overlap_end=end,
                usable_minutes=int((end - start).total_seconds() // 60),
                suggested_activity=suggested_activity,
                suggested_category=suggested_category,
            )
        )
    matches.sort(key=lambda m: m.usable_minutes, reverse=True)
    return matches
