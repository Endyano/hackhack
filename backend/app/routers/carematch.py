from uuid import UUID

from fastapi import APIRouter

from app.errors import AppError
from app.models.schemas import (
    ActivityInvitation,
    ActivityInvitationStatusResponse,
    CareMatchInvitationCreate,
    CareMatchInvitationsResponse,
    CareMatchMatchesResponse,
)
from app.services.carematch import find_matches
from app.services.supabase_client import get_supabase

router = APIRouter(tags=["carematch"])


def _get_user(user_id: UUID | str) -> dict:
    supabase = get_supabase()
    result = supabase.table("users").select("*").eq("id", str(user_id)).maybe_single().execute()
    if not result or not result.data:
        raise AppError(404, "USER_NOT_FOUND", "User not found")
    return result.data


def _are_friends(a: str, b: str) -> bool:
    supabase = get_supabase()
    result = (
        supabase.table("friendships")
        .select("id")
        .or_(f"and(user_id.eq.{a},friend_id.eq.{b}),and(user_id.eq.{b},friend_id.eq.{a})")
        .eq("status", "accepted")
        .execute()
    )
    return bool(result.data)


def _to_invitation(row: dict, users_by_id: dict[str, dict], viewer_id: str) -> ActivityInvitation:
    sender = users_by_id.get(row["sender_id"])
    receiver = users_by_id.get(row["receiver_id"])
    return ActivityInvitation(
        id=row["id"],
        sender_id=row["sender_id"],
        sender_name=sender["name"] if sender else "Unknown",
        receiver_id=row["receiver_id"],
        receiver_name=receiver["name"] if receiver else "Unknown",
        recommendation_id=row.get("recommendation_id"),
        activity_name=row["activity_name"],
        proposed_start=row["proposed_start"],
        proposed_end=row["proposed_end"],
        location=row.get("location"),
        status=row["status"],
        created_at=row["created_at"],
        direction="incoming" if row["receiver_id"] == viewer_id else "outgoing",
    )


@router.get("/carematch/{user_id}/matches", response_model=CareMatchMatchesResponse)
def get_matches(user_id: UUID) -> CareMatchMatchesResponse:
    _get_user(user_id)  # 404 if missing
    return CareMatchMatchesResponse(matches=find_matches(user_id))


@router.post("/carematch/invitations", response_model=ActivityInvitation, status_code=201)
def send_invitation(payload: CareMatchInvitationCreate) -> ActivityInvitation:
    supabase = get_supabase()
    sender = _get_user(payload.sender_id)
    receiver = _get_user(payload.receiver_id)

    if str(payload.sender_id) == str(payload.receiver_id):
        raise AppError(400, "CANNOT_INVITE_SELF", "You can't invite yourself")
    if not _are_friends(str(payload.sender_id), str(payload.receiver_id)):
        raise AppError(403, "NOT_FRIENDS", "You can only invite accepted friends")
    if payload.proposed_end <= payload.proposed_start:
        raise AppError(400, "INVALID_TIME_RANGE", "proposed_end must be after proposed_start")

    insert_result = (
        supabase.table("activity_invitations")
        .insert(
            {
                "sender_id": str(payload.sender_id),
                "receiver_id": str(payload.receiver_id),
                "recommendation_id": str(payload.recommendation_id) if payload.recommendation_id else None,
                "activity_name": payload.activity_name,
                "proposed_start": payload.proposed_start.isoformat(),
                "proposed_end": payload.proposed_end.isoformat(),
                "location": payload.location,
                "status": "pending",
            }
        )
        .execute()
    )
    if not insert_result.data:
        raise AppError(500, "SUPABASE_ERROR", "Failed to send invitation")
    row = insert_result.data[0]
    users_by_id = {sender["id"]: sender, receiver["id"]: receiver}
    return _to_invitation(row, users_by_id, viewer_id=str(payload.sender_id))


@router.get("/carematch/invitations/{user_id}", response_model=CareMatchInvitationsResponse)
def list_invitations(user_id: UUID) -> CareMatchInvitationsResponse:
    supabase = get_supabase()
    _get_user(user_id)  # 404 if missing
    result = (
        supabase.table("activity_invitations")
        .select("*")
        .or_(f"sender_id.eq.{user_id},receiver_id.eq.{user_id}")
        .neq("status", "cancelled")
        .order("created_at", desc=True)
        .execute()
    )
    rows = result.data or []

    other_ids = {
        row["receiver_id"] if row["sender_id"] == str(user_id) else row["sender_id"] for row in rows
    }
    other_ids.add(str(user_id))
    users_by_id: dict[str, dict] = {}
    if other_ids:
        users_result = supabase.table("users").select("id, name").in_("id", list(other_ids)).execute()
        users_by_id = {u["id"]: u for u in users_result.data or []}

    incoming: list[ActivityInvitation] = []
    outgoing: list[ActivityInvitation] = []
    for row in rows:
        invitation = _to_invitation(row, users_by_id, viewer_id=str(user_id))
        (incoming if invitation.direction == "incoming" else outgoing).append(invitation)
    return CareMatchInvitationsResponse(incoming=incoming, outgoing=outgoing)


def _update_invitation_status(invitation_id: UUID, status: str) -> ActivityInvitationStatusResponse:
    supabase = get_supabase()
    result = (
        supabase.table("activity_invitations")
        .update({"status": status})
        .eq("id", str(invitation_id))
        .execute()
    )
    if not result.data:
        raise AppError(404, "INVITATION_NOT_FOUND", "Invitation not found")
    row = result.data[0]
    return ActivityInvitationStatusResponse(invitation_id=row["id"], status=row["status"])


@router.patch("/carematch/invitations/{invitation_id}/accept", response_model=ActivityInvitationStatusResponse)
def accept_invitation(invitation_id: UUID) -> ActivityInvitationStatusResponse:
    return _update_invitation_status(invitation_id, "accepted")


@router.patch("/carematch/invitations/{invitation_id}/decline", response_model=ActivityInvitationStatusResponse)
def decline_invitation(invitation_id: UUID) -> ActivityInvitationStatusResponse:
    return _update_invitation_status(invitation_id, "declined")
