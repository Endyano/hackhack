"""Supabase reads/writes for google_calendar_connections. Service-role
access only -- these rows (and this module) are never touched by anything
the frontend can reach directly."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from app.services.supabase_client import get_supabase


def _to_utc_iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def parse_token_expiry(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None


def get_connection(user_id: UUID) -> dict | None:
    supabase = get_supabase()
    result = (
        supabase.table("google_calendar_connections")
        .select("*")
        .eq("user_id", str(user_id))
        .maybe_single()
        .execute()
    )
    return result.data if result else None


def upsert_connection(
    user_id: UUID,
    access_token: str,
    refresh_token: str | None,
    token_expiry: datetime | None,
    scope: str | None,
) -> None:
    supabase = get_supabase()
    data: dict = {"user_id": str(user_id), "access_token": access_token, "scope": scope}
    if refresh_token:
        data["refresh_token"] = refresh_token
    if token_expiry:
        data["token_expiry"] = _to_utc_iso(token_expiry)
    supabase.table("google_calendar_connections").upsert(data, on_conflict="user_id").execute()


def update_tokens(user_id: UUID, access_token: str, token_expiry: datetime | None) -> None:
    supabase = get_supabase()
    data: dict = {"access_token": access_token}
    if token_expiry:
        data["token_expiry"] = _to_utc_iso(token_expiry)
    supabase.table("google_calendar_connections").update(data).eq("user_id", str(user_id)).execute()


def touch_last_synced(user_id: UUID, when: datetime) -> None:
    supabase = get_supabase()
    supabase.table("google_calendar_connections").update({"last_synced_at": _to_utc_iso(when)}).eq(
        "user_id", str(user_id)
    ).execute()


def delete_connection(user_id: UUID) -> None:
    supabase = get_supabase()
    supabase.table("google_calendar_connections").delete().eq("user_id", str(user_id)).execute()
