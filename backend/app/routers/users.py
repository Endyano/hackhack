from fastapi import APIRouter
from uuid import UUID

from app.errors import AppError
from app.models.schemas import User, UserPreferences, UserUpdate
from app.services.supabase_client import get_supabase

router = APIRouter(tags=["users"])


@router.get("/users", response_model=list[User])
def list_users() -> list[User]:
    """Not in the original API contract -- added so the frontend's demo
    user-picker (CLAUDE.md: "use a demo user-picker", no real auth) has a way
    to discover which seeded users exist."""
    supabase = get_supabase()
    result = supabase.table("users").select("*").order("created_at").execute()
    return [User.model_validate(row) for row in result.data or []]


@router.get("/users/{user_id}", response_model=User)
def get_user(user_id: UUID) -> User:
    supabase = get_supabase()
    result = supabase.table("users").select("*").eq("id", str(user_id)).maybe_single().execute()
    if not result or not result.data:
        raise AppError(404, "USER_NOT_FOUND", "User not found")
    return User.model_validate(result.data)


@router.put("/users/{user_id}", response_model=User)
def update_user(user_id: UUID, payload: UserUpdate) -> User:
    supabase = get_supabase()
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise AppError(400, "NO_UPDATE_FIELDS", "No fields to update")

    result = supabase.table("users").update(updates).eq("id", str(user_id)).execute()
    if not result.data:
        raise AppError(404, "USER_NOT_FOUND", "User not found")
    return User.model_validate(result.data[0])


@router.get("/users/{user_id}/preferences", response_model=UserPreferences)
def get_user_preferences(user_id: UUID) -> UserPreferences:
    supabase = get_supabase()
    result = (
        supabase.table("user_preferences")
        .select("*")
        .eq("user_id", str(user_id))
        .maybe_single()
        .execute()
    )
    if not result or not result.data:
        raise AppError(404, "PREFERENCES_NOT_FOUND", "Preferences not found for user")
    return UserPreferences.model_validate(result.data)
