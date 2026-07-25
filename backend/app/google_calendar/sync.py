"""Orchestrates a Google Calendar sync for one user: load stored tokens,
refresh if needed, fetch events for the window, upsert into calendar_events,
and remove events that were deleted on Google's side. Deterministic -- no AI
involved, matches CLAUDE.md's "backend decides what's possible" split."""

from __future__ import annotations

from datetime import date as date_cls, datetime, time as time_cls
from uuid import UUID

from app.errors import AppError
from app.google_calendar import oauth, store
from app.google_calendar.client import fetch_events as fetch_google_events
from app.services.calendar import day_bounds
from app.services.supabase_client import get_supabase


def sync_user_calendar(
    user_id: UUID,
    start: datetime | None = None,
    end: datetime | None = None,
) -> tuple[int, int, datetime]:
    """Returns (synced_count, removed_count, last_synced_at). Raises AppError
    (GOOGLE_NOT_CONNECTED / GOOGLE_TOKEN_* / GOOGLE_CALENDAR_FETCH_FAILED) on
    failure -- callers decide whether that should surface as a hard error or
    be swallowed (e.g. the opportunistic pre-recommendation sync)."""
    connection = store.get_connection(user_id)
    if not connection:
        raise AppError(404, "GOOGLE_NOT_CONNECTED", "Google Calendar is not connected for this user.")

    if start is None or end is None:
        today = date_cls.today()
        start, end = day_bounds(today, time_cls.min, time_cls.max)

    creds = oauth.build_credentials(
        access_token=connection["access_token"],
        refresh_token=connection.get("refresh_token"),
        token_expiry=store.parse_token_expiry(connection.get("token_expiry")),
    )
    previous_token = creds.token
    creds = oauth.refresh_if_needed(creds)
    if creds.token != previous_token:
        store.update_tokens(user_id, creds.token, creds.expiry)

    google_events = fetch_google_events(creds, start, end)

    supabase = get_supabase()
    now = datetime.now(start.tzinfo)
    kept_ids: list[str] = []
    for event in google_events:
        row = {
            "user_id": str(user_id),
            "external_event_id": event.external_id,
            "title": event.title,
            "start_time": event.start.isoformat(),
            "end_time": event.end.isoformat(),
            "event_type": "google_calendar",
            "source": "google_calendar",
            "last_synced_at": now.isoformat(),
        }
        supabase.table("calendar_events").upsert(row, on_conflict="user_id,external_event_id").execute()
        kept_ids.append(event.external_id)

    # Prune events that no longer exist on Google's side, scoped to this
    # sync's window so events outside it (a different day, say) are untouched.
    delete_query = (
        supabase.table("calendar_events")
        .delete()
        .eq("user_id", str(user_id))
        .eq("source", "google_calendar")
        .gte("start_time", start.isoformat())
        .lte("start_time", end.isoformat())
    )
    if kept_ids:
        delete_query = delete_query.not_.in_("external_event_id", kept_ids)
    removed_result = delete_query.execute()
    removed_count = len(removed_result.data or [])

    store.touch_last_synced(user_id, now)
    return len(google_events), removed_count, now
