import logging
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException

from app.foundry.client import FoundryError, generate_recommendation_raw
from app.foundry.fallback import fallback_for
from app.foundry.validation import FoundryValidationError, RawRecommendation, parse_and_validate
from app.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

MAX_FOUNDRY_ATTEMPTS = 2


def run_foundry_and_persist(
    user_id: UUID,
    usable_minutes: int,
    start_time: datetime,
    foundry_context: dict,
    avoid_activity: str | None = None,
) -> tuple[RawRecommendation, UUID]:
    """Calls Foundry (with one retry), falls back to the hardcoded
    recommendation if both attempts fail, and persists whichever result to
    activity_recommendations. Shared by generate/shorten/replace so the
    retry+fallback behavior stays identical across all three."""
    raw_rec: RawRecommendation | None = None
    last_error: Exception | None = None
    for attempt in range(1, MAX_FOUNDRY_ATTEMPTS + 1):
        try:
            raw_text = generate_recommendation_raw(foundry_context, usable_minutes, avoid_activity)
            raw_rec = parse_and_validate(raw_text, usable_minutes)
            break
        except (FoundryError, FoundryValidationError) as exc:
            last_error = exc
            logger.warning("Foundry attempt %d/%d failed: %s", attempt, MAX_FOUNDRY_ATTEMPTS, exc)

    if raw_rec is None:
        logger.warning("Foundry exhausted retries, using fallback recommendation: %s", last_error)
        raw_rec = fallback_for(usable_minutes)

    supabase = get_supabase()
    insert_result = (
        supabase.table("activity_recommendations")
        .insert(
            {
                "user_id": str(user_id),
                "activity_name": raw_rec.activity,
                "category": raw_rec.category,
                "start_time": start_time.isoformat(),
                "duration_minutes": raw_rec.duration_minutes,
                "intensity": raw_rec.intensity,
                "reason": raw_rec.reason,
                "status": "pending",
            }
        )
        .execute()
    )
    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Failed to save recommendation")
    return raw_rec, UUID(insert_result.data[0]["id"])


def get_recommendation_row(recommendation_id: UUID) -> dict:
    supabase = get_supabase()
    result = (
        supabase.table("activity_recommendations")
        .select("*")
        .eq("id", str(recommendation_id))
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return result.data


def update_recommendation_status(recommendation_id: UUID, status: str) -> dict:
    supabase = get_supabase()
    result = (
        supabase.table("activity_recommendations")
        .update({"status": status})
        .eq("id", str(recommendation_id))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return result.data[0]
