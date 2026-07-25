from uuid import UUID

from fastapi import APIRouter

from app.models.schemas import RecommendationContext
from app.services.recommendation_context import build_recommendation_context

router = APIRouter(tags=["recommendation-context"])


@router.get("/recommendation-context/{user_id}", response_model=RecommendationContext)
def get_recommendation_context(user_id: UUID) -> RecommendationContext:
    return build_recommendation_context(user_id)
