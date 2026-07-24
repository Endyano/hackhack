from fastapi import APIRouter, HTTPException
from uuid import UUID

from app.models.schemas import DailyCheckIn, DailyCheckInCreate
from app.services.supabase_client import get_supabase

router = APIRouter(tags=["check-ins"])


@router.post("/check-ins", response_model=DailyCheckIn, status_code=201)
def create_check_in(payload: DailyCheckInCreate) -> DailyCheckIn:
    supabase = get_supabase()
    insert_data = payload.model_dump(mode="json")
    result = supabase.table("daily_check_ins").insert(insert_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create check-in")
    return DailyCheckIn.model_validate(result.data[0])


@router.get("/check-ins/{user_id}/latest", response_model=DailyCheckIn)
def get_latest_check_in(user_id: UUID) -> DailyCheckIn:
    supabase = get_supabase()
    result = (
        supabase.table("daily_check_ins")
        .select("*")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No check-ins found for user")
    return DailyCheckIn.model_validate(result.data[0])
