from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.models.schemas import ActivityHistoryEntry, ActivityResultRequest
from app.services.recommendations import get_recommendation_row, update_recommendation_status
from app.services.supabase_client import get_supabase

router = APIRouter(tags=["activities"])


@router.get("/activities/{user_id}/history", response_model=list[ActivityHistoryEntry])
def get_activity_history(user_id: UUID) -> list[ActivityHistoryEntry]:
    supabase = get_supabase()
    result = (
        supabase.table("activity_history")
        .select("*, activity_recommendations(activity_name, category, duration_minutes, intensity)")
        .eq("user_id", str(user_id))
        .order("completed_at", desc=True)
        .execute()
    )
    entries = []
    for row in result.data or []:
        joined = row.get("activity_recommendations") or {}
        entries.append(
            ActivityHistoryEntry(
                id=row["id"],
                recommendation_id=row.get("recommendation_id"),
                activity_name=joined.get("activity_name"),
                category=joined.get("category"),
                duration_minutes=joined.get("duration_minutes"),
                intensity=joined.get("intensity"),
                completion_status=row.get("completion_status"),
                feedback=row.get("feedback"),
                completed_at=row["completed_at"],
            )
        )
    return entries


@router.post("/activities/{user_id}/result", response_model=ActivityHistoryEntry)
def report_activity_result(user_id: UUID, payload: ActivityResultRequest) -> ActivityHistoryEntry:
    recommendation = get_recommendation_row(payload.recommendation_id)
    if recommendation["user_id"] != str(user_id):
        raise HTTPException(status_code=404, detail="Recommendation does not belong to this user")

    supabase = get_supabase()
    insert_result = (
        supabase.table("activity_history")
        .insert(
            {
                "user_id": str(user_id),
                "recommendation_id": str(payload.recommendation_id),
                "completion_status": payload.completion_status,
                "feedback": payload.feedback,
            }
        )
        .execute()
    )
    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Failed to save activity result")

    update_recommendation_status(payload.recommendation_id, payload.completion_status)

    row = insert_result.data[0]
    return ActivityHistoryEntry(
        id=row["id"],
        recommendation_id=row.get("recommendation_id"),
        activity_name=recommendation.get("activity_name"),
        category=recommendation.get("category"),
        duration_minutes=recommendation.get("duration_minutes"),
        intensity=recommendation.get("intensity"),
        completion_status=row.get("completion_status"),
        feedback=row.get("feedback"),
        completed_at=row["completed_at"],
    )
