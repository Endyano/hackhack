from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException

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
        "location": context.location,
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
        raise HTTPException(status_code=422, detail="No usable free time available today")

    local_start = context.free_period.start_time.astimezone()
    foundry_input = build_foundry_input(context)
    raw_rec, recommendation_id = run_foundry_and_persist(
        payload.user_id, context.free_period.usable_minutes, context.free_period.start_time, foundry_input
    )
    return _to_response(recommendation_id, raw_rec, local_start)


@router.post("/recommendations/{recommendation_id}/accept", response_model=RecommendationStatusResponse)
def accept_recommendation(recommendation_id: UUID) -> RecommendationStatusResponse:
    get_recommendation_row(recommendation_id)  # 404 if missing
    update_recommendation_status(recommendation_id, "accepted")
    return RecommendationStatusResponse(recommendation_id=recommendation_id, status="accepted")


@router.post("/recommendations/{recommendation_id}/skip", response_model=RecommendationStatusResponse)
def skip_recommendation(recommendation_id: UUID) -> RecommendationStatusResponse:
    get_recommendation_row(recommendation_id)  # 404 if missing
    update_recommendation_status(recommendation_id, "skipped")
    return RecommendationStatusResponse(recommendation_id=recommendation_id, status="skipped")


@router.post("/recommendations/{recommendation_id}/shorten", response_model=RecommendationResponse)
def shorten_recommendation(recommendation_id: UUID) -> RecommendationResponse:
    original = get_recommendation_row(recommendation_id)
    user_id = UUID(original["user_id"])

    context = build_recommendation_context(user_id)
    if context.free_period is None:
        raise HTTPException(status_code=422, detail="No usable free time available today")

    new_usable_minutes = max(
        MIN_SHORTEN_MINUTES,
        min(original["duration_minutes"] // 2, context.free_period.usable_minutes),
    )
    local_start = context.free_period.start_time.astimezone()
    foundry_input = build_foundry_input(context, usable_minutes=new_usable_minutes)

    update_recommendation_status(recommendation_id, "shortened")
    raw_rec, new_id = run_foundry_and_persist(
        user_id, new_usable_minutes, context.free_period.start_time, foundry_input
    )
    return _to_response(new_id, raw_rec, local_start)


@router.post("/recommendations/{recommendation_id}/replace", response_model=RecommendationResponse)
def replace_recommendation(recommendation_id: UUID) -> RecommendationResponse:
    original = get_recommendation_row(recommendation_id)
    user_id = UUID(original["user_id"])

    context = build_recommendation_context(user_id)
    if context.free_period is None:
        raise HTTPException(status_code=422, detail="No usable free time available today")

    local_start = context.free_period.start_time.astimezone()
    foundry_input = build_foundry_input(context)

    update_recommendation_status(recommendation_id, "replaced")
    raw_rec, new_id = run_foundry_and_persist(
        user_id,
        context.free_period.usable_minutes,
        context.free_period.start_time,
        foundry_input,
        avoid_activity=original["activity_name"],
    )
    return _to_response(new_id, raw_rec, local_start)
