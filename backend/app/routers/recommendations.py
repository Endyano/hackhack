from datetime import datetime
from uuid import UUID

from fastapi import APIRouter

from app.errors import AppError
from app.foundry.intensity_rules import max_allowed_intensity
from app.foundry.validation import RawRecommendation
from app.models.schemas import (
    CareMatchInfo,
    RecommendationContext,
    RecommendationGenerateRequest,
    RecommendationResponse,
    RecommendationStatusResponse,
)
from app.services.recommendation_context import build_recommendation_context
from app.services.recommendations import (
    get_recommendation_row,
    run_foundry_and_persist,
    update_recommendation_status,
)

router = APIRouter(tags=["recommendations"])

MIN_SHORTEN_MINUTES = 5


def build_foundry_input(context: RecommendationContext, usable_minutes: int | None = None) -> dict:
    assert context.free_period is not None
    local_start = context.free_period.start_time.astimezone()
    local_end = context.free_period.end_time.astimezone()
    minutes = usable_minutes if usable_minutes is not None else context.free_period.usable_minutes
    return {
        "energy": context.energy,
        "mood": context.mood,
        "goal": context.goal,
        "experience": context.experience,
        "recent_activity": context.recent_activity,
        "preferred_activities": context.preferences.preferred_activities if context.preferences else [],
        "disliked_activities": context.preferences.disliked_activities if context.preferences else [],
        "free_period": {
            "start": local_start.strftime("%H:%M"),
            "end": local_end.strftime("%H:%M"),
            "usable_minutes": minutes,
        },
    }


def _to_response(
    recommendation_id: UUID, raw_rec: RawRecommendation, local_start: datetime
) -> RecommendationResponse:
    return RecommendationResponse(
        recommendation_id=recommendation_id,
        activity=raw_rec.activity,
        category=raw_rec.category,
        start_time=local_start.strftime("%H:%M"),
        duration_minutes=raw_rec.duration_minutes,
        intensity=raw_rec.intensity,
        reason=raw_rec.reason,
        social_compatible=False,
        carematch=CareMatchInfo(available=False),
    )


@router.post("/recommendations/generate", response_model=RecommendationResponse)
def generate_recommendation(payload: RecommendationGenerateRequest) -> RecommendationResponse:
    context = build_recommendation_context(payload.user_id)
    if context.free_period is None:
        raise AppError(422, "NO_FREE_SLOT", "No suitable free period was found today.")

    local_start = context.free_period.start_time.astimezone()
    foundry_input = build_foundry_input(context)
    raw_rec, recommendation_id = run_foundry_and_persist(
        payload.user_id,
        context.free_period.usable_minutes,
        context.free_period.start_time,
        foundry_input,
        max_intensity=max_allowed_intensity(context.energy, context.mood),
    )
    return _to_response(recommendation_id, raw_rec, local_start)


@router.post("/recommendations/{recommendation_id}/accept", response_model=RecommendationStatusResponse)
def accept_recommendation(recommendation_id: UUID) -> RecommendationStatusResponse:
    get_recommendation_row(recommendation_id)  # 404 if missing
    update_recommendation_status(recommendation_id, "accepted")
    return RecommendationStatusResponse(recommendation_id=recommendation_id, status="accepted")


def _regenerate(
    recommendation_id: UUID,
    new_status: str,
    previous_action: str,
    usable_minutes_override: int | None = None,
) -> RecommendationResponse:
    """Shared by shorten/replace/skip: all three reject the current
    suggestion and ask Foundry for a new one, just with different framing and
    (for shorten) a smaller time budget."""
    original = get_recommendation_row(recommendation_id)
    user_id = UUID(original["user_id"])

    context = build_recommendation_context(user_id)
    if context.free_period is None:
        raise AppError(422, "NO_FREE_SLOT", "No suitable free period was found today.")

    if usable_minutes_override is not None:
        usable_minutes = max(
            MIN_SHORTEN_MINUTES, min(usable_minutes_override, context.free_period.usable_minutes)
        )
    else:
        usable_minutes = context.free_period.usable_minutes

    local_start = context.free_period.start_time.astimezone()
    foundry_input = build_foundry_input(context, usable_minutes=usable_minutes)

    update_recommendation_status(recommendation_id, new_status)
    raw_rec, new_id = run_foundry_and_persist(
        user_id,
        usable_minutes,
        context.free_period.start_time,
        foundry_input,
        previous_activity=original["activity_name"],
        previous_action=previous_action,
        max_intensity=max_allowed_intensity(context.energy, context.mood),
    )
    return _to_response(new_id, raw_rec, local_start)


@router.post("/recommendations/{recommendation_id}/skip", response_model=RecommendationResponse)
def skip_recommendation(recommendation_id: UUID) -> RecommendationResponse:
    return _regenerate(recommendation_id, "skipped", "skip")


@router.post("/recommendations/{recommendation_id}/shorten", response_model=RecommendationResponse)
def shorten_recommendation(recommendation_id: UUID) -> RecommendationResponse:
    original = get_recommendation_row(recommendation_id)
    return _regenerate(
        recommendation_id,
        "shortened",
        "shorten",
        usable_minutes_override=original["duration_minutes"] // 2,
    )


@router.post("/recommendations/{recommendation_id}/replace", response_model=RecommendationResponse)
def replace_recommendation(recommendation_id: UUID) -> RecommendationResponse:
    return _regenerate(recommendation_id, "replaced", "replace")
