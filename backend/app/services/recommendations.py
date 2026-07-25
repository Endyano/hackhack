import logging
from datetime import datetime
from uuid import UUID

from app.errors import AppError
from app.foundry.client import FoundryError, generate_recommendation_raw
from app.foundry.fallback import fallback_for
from app.foundry.prompts import PreviousAction
from app.foundry.validation import FoundryValidationError, RawRecommendation, parse_and_validate
from app.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

MAX_FOUNDRY_ATTEMPTS = 2


def run_foundry_and_persist(
    user_id: UUID,
    usable_minutes: int,
    start_time: datetime,
    foundry_context: dict,
    previous_activity: str | None = None,
    previous_action: PreviousAction | None = None,
    max_intensity: str = "hard",
) -> tuple[RawRecommendation, UUID]:
    """Calls Foundry (with one retry), falls back to the hardcoded
    recommendation if both attempts fail, and persists whichever result to
    activity_recommendations. Shared by generate/shorten/replace/skip so the
    retry+fallback behavior stays identical across all four."""
    raw_rec: RawRecommendation | None = None
    last_error: Exception | None = None
    for attempt in range(1, MAX_FOUNDRY_ATTEMPTS + 1):
        try:
            raw_text = generate_recommendation_raw(
                foundry_context, usable_minutes, previous_activity, previous_action, max_intensity
            )
            raw_rec = parse_and_validate(raw_text, usable_minutes, max_intensity)
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
        raise AppError(500, "SUPABASE_ERROR", "Failed to save recommendation")
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
    if not result or not result.data:
        raise AppError(404, "RECOMMENDATION_NOT_FOUND", "Recommendation not found")
    return result.data


def update_recommendation_status(recommendation_id: UUID, status: str) -> dict:
    supabase = get_supabase()
    result = (
        supabase.table("activity_recommendations")
        .update({"status": status})
        .eq("id", str(recommendation_id))
        .execute()
    )
    if not result or not result.data:
        raise AppError(404, "RECOMMENDATION_NOT_FOUND", "Recommendation not found")
    return result.data[0]
