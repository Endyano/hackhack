from uuid import UUID

from fastapi import APIRouter

from app.errors import AppError
from app.models.schemas import (
    FriendRequestCreate,
    FriendRequestsResponse,
    FriendRequestSummary,
    FriendshipStatusResponse,
    FriendsListResponse,
    FriendSummary,
)
from app.services.supabase_client import get_supabase

router = APIRouter(tags=["friends"])


def _get_user(user_id: UUID) -> dict:
    supabase = get_supabase()
    result = supabase.table("users").select("*").eq("id", str(user_id)).maybe_single().execute()
    if not result or not result.data:
        raise AppError(404, "USER_NOT_FOUND", "User not found")
    return result.data


def _get_user_by_username(username: str) -> dict | None:
    supabase = get_supabase()
    result = (
        supabase.table("users").select("*").ilike("username", username).maybe_single().execute()
    )
    return result.data if result and result.data else None


def _existing_friendship(a: str, b: str) -> dict | None:
    supabase = get_supabase()
    result = (
        supabase.table("friendships")
        .select("*")
        .or_(f"and(user_id.eq.{a},friend_id.eq.{b}),and(user_id.eq.{b},friend_id.eq.{a})")
        .execute()
    )
    rows = result.data or []
    return rows[0] if rows else None


@router.post("/friends/request", response_model=FriendshipStatusResponse, status_code=201)
def send_friend_request(payload: FriendRequestCreate) -> FriendshipStatusResponse:
    supabase = get_supabase()
    _get_user(payload.user_id)  # 404 if the sender itself doesn't exist

    target = _get_user_by_username(payload.friend_username)
    if not target:
        raise AppError(
            404, "FRIEND_NOT_FOUND", f'No user found with username "{payload.friend_username}"'
        )
    if target["id"] == str(payload.user_id):
        raise AppError(400, "CANNOT_FRIEND_SELF", "You can't send a friend request to yourself")

    existing = _existing_friendship(str(payload.user_id), target["id"])
    if existing:
        if existing["status"] == "accepted":
            raise AppError(409, "ALREADY_FRIENDS", "You're already friends with this user")
        if existing["status"] == "pending":
            raise AppError(
                409, "REQUEST_ALREADY_PENDING", "A friend request is already pending between you two"
            )
        # status == "declined" -- allow re-sending by replacing the old row
        supabase.table("friendships").delete().eq("id", existing["id"]).execute()

    insert_result = (
        supabase.table("friendships")
        .insert({"user_id": str(payload.user_id), "friend_id": target["id"], "status": "pending"})
        .execute()
    )
    if not insert_result.data:
        raise AppError(500, "SUPABASE_ERROR", "Failed to send friend request")
    row = insert_result.data[0]
    return FriendshipStatusResponse(friendship_id=row["id"], status=row["status"])


@router.get("/friends/{user_id}", response_model=FriendsListResponse)
def list_friends(user_id: UUID) -> FriendsListResponse:
    supabase = get_supabase()
    result = (
        supabase.table("friendships")
        .select("*")
        .or_(f"user_id.eq.{user_id},friend_id.eq.{user_id}")
        .eq("status", "accepted")
        .execute()
    )
    rows = result.data or []
    other_ids = [row["friend_id"] if row["user_id"] == str(user_id) else row["user_id"] for row in rows]

    users_by_id: dict[str, dict] = {}
    if other_ids:
        users_result = supabase.table("users").select("id, username, name").in_("id", other_ids).execute()
        users_by_id = {u["id"]: u for u in users_result.data or []}

    friends = []
    seen_other_ids: set[str] = set()
    for row in rows:
        other_id = row["friend_id"] if row["user_id"] == str(user_id) else row["user_id"]
        # Defends against stray duplicate rows (e.g. one row per direction
        # from old seed data) -- a friendship should only ever appear once
        # per other user, regardless of how many rows represent it.
        if other_id in seen_other_ids:
            continue
        other = users_by_id.get(other_id)
        if other:
            seen_other_ids.add(other_id)
            friends.append(
                FriendSummary(
                    friendship_id=row["id"], user_id=other["id"], username=other["username"], name=other["name"]
                )
            )
    return FriendsListResponse(friends=friends)


@router.get("/friends/{user_id}/requests", response_model=FriendRequestsResponse)
def list_friend_requests(user_id: UUID) -> FriendRequestsResponse:
    supabase = get_supabase()
    result = (
        supabase.table("friendships")
        .select("*")
        .or_(f"user_id.eq.{user_id},friend_id.eq.{user_id}")
        .eq("status", "pending")
        .execute()
    )
    rows = result.data or []
    other_ids = [row["friend_id"] if row["user_id"] == str(user_id) else row["user_id"] for row in rows]

    users_by_id: dict[str, dict] = {}
    if other_ids:
        users_result = supabase.table("users").select("id, username, name").in_("id", other_ids).execute()
        users_by_id = {u["id"]: u for u in users_result.data or []}

    incoming: list[FriendRequestSummary] = []
    outgoing: list[FriendRequestSummary] = []
    seen_other_ids: set[str] = set()
    for row in rows:
        is_incoming = row["friend_id"] == str(user_id)
        other_id = row["user_id"] if is_incoming else row["friend_id"]
        if other_id in seen_other_ids:
            continue
        other = users_by_id.get(other_id)
        if not other:
            continue
        seen_other_ids.add(other_id)
        summary = FriendRequestSummary(
            friendship_id=row["id"],
            user_id=other["id"],
            username=other["username"],
            name=other["name"],
            direction="incoming" if is_incoming else "outgoing",
        )
        (incoming if is_incoming else outgoing).append(summary)
    return FriendRequestsResponse(incoming=incoming, outgoing=outgoing)


@router.patch("/friends/requests/{friendship_id}/accept", response_model=FriendshipStatusResponse)
def accept_friend_request(friendship_id: UUID) -> FriendshipStatusResponse:
    supabase = get_supabase()
    result = (
        supabase.table("friendships")
        .update({"status": "accepted"})
        .eq("id", str(friendship_id))
        .execute()
    )
    if not result.data:
        raise AppError(404, "FRIEND_REQUEST_NOT_FOUND", "Friend request not found")
    row = result.data[0]
    return FriendshipStatusResponse(friendship_id=row["id"], status=row["status"])


@router.patch("/friends/requests/{friendship_id}/decline", response_model=FriendshipStatusResponse)
def decline_friend_request(friendship_id: UUID) -> FriendshipStatusResponse:
    supabase = get_supabase()
    result = (
        supabase.table("friendships")
        .update({"status": "declined"})
        .eq("id", str(friendship_id))
        .execute()
    )
    if not result.data:
        raise AppError(404, "FRIEND_REQUEST_NOT_FOUND", "Friend request not found")
    row = result.data[0]
    return FriendshipStatusResponse(friendship_id=row["id"], status=row["status"])
