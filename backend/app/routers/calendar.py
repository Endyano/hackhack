from datetime import date as date_cls, time
from uuid import UUID

from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse

from app.config import get_settings
from app.errors import AppError
from app.google_calendar import oauth, store
from app.google_calendar.sync import sync_user_calendar
from app.models.schemas import (
    CalendarEvent,
    FreeSlotItem,
    FreeSlotsResponse,
    GoogleConnectionStatus,
    GoogleSyncRequest,
    GoogleSyncResult,
)
from app.services.calendar import day_bounds, fetch_events
from app.services.free_slots import (
    DEFAULT_BUFFER_MINUTES,
    DEFAULT_MIN_SLOT_MINUTES,
    compute_free_slots,
)
from app.services.supabase_client import get_supabase

router = APIRouter(tags=["calendar"])


@router.get("/calendar/{user_id}", response_model=list[CalendarEvent])
def get_calendar(user_id: UUID, date: date_cls | None = Query(default=None)) -> list[CalendarEvent]:
    if date is None:
        return fetch_events(user_id)
    start, end = day_bounds(date, time.min, time.max)
    return fetch_events(user_id, start, end)


@router.get("/calendar/{user_id}/free-slots", response_model=FreeSlotsResponse)
def get_free_slots(
    user_id: UUID,
    date: date_cls | None = Query(default=None, description="Defaults to today"),
    day_start: time = Query(default=None),
    day_end: time = Query(default=None),
    buffer_minutes: int = Query(default=DEFAULT_BUFFER_MINUTES, ge=0),
    min_slot_minutes: int = Query(default=DEFAULT_MIN_SLOT_MINUTES, ge=0),
) -> FreeSlotsResponse:
    target_date = date or date_cls.today()
    start_bound, end_bound = day_bounds(
        target_date,
        day_start or time(7, 0),
        day_end or time(23, 0),
    )
    events = fetch_events(user_id, start_bound, end_bound)
    slots = compute_free_slots(
        events,
        day_start=start_bound,
        day_end=end_bound,
        buffer_minutes=buffer_minutes,
        min_slot_minutes=min_slot_minutes,
    )
    source = "google_calendar" if any(e.source == "google_calendar" for e in events) else "manual"
    return FreeSlotsResponse(
        date=target_date.isoformat(),
        source=source,
        free_slots=[
            FreeSlotItem(start_time=slot.start_time, end_time=slot.end_time, duration_minutes=slot.usable_minutes)
            for slot in slots
        ],
    )


# ============================================================
# Google Calendar connect + sync
# ============================================================
@router.get("/calendar/google/connect")
def google_connect(user_id: UUID) -> RedirectResponse:
    """Browser navigation, not a fetch call -- redirects straight to Google's
    consent screen. The frontend triggers this with window.location.href."""
    url = oauth.build_authorization_url(user_id)
    return RedirectResponse(url, status_code=307)


@router.get("/calendar/google/callback")
def google_callback(code: str | None = None, state: str | None = None, error: str | None = None) -> RedirectResponse:
    """Google redirects the browser here after consent. Always redirects the
    browser back into the app (never returns raw JSON/errors) since the user
    is mid-navigation, not making an API call."""
    settings = get_settings()
    frontend = settings.frontend_url.rstrip("/")

    if error:
        return RedirectResponse(f"{frontend}/smart-calendar?google=error&reason={error}", status_code=307)
    if not code or not state:
        return RedirectResponse(f"{frontend}/smart-calendar?google=error&reason=missing_code", status_code=307)

    try:
        user_id, creds = oauth.exchange_code(code, state)
    except oauth.OAuthStateError:
        return RedirectResponse(f"{frontend}/smart-calendar?google=error&reason=invalid_state", status_code=307)
    except AppError:
        return RedirectResponse(f"{frontend}/smart-calendar?google=error&reason=token_exchange_failed", status_code=307)

    store.upsert_connection(
        user_id,
        access_token=creds.token,
        refresh_token=creds.refresh_token,
        token_expiry=creds.expiry,
        scope=" ".join(creds.scopes or []),
    )

    try:
        sync_user_calendar(user_id)
    except AppError:
        # Connection is saved even if the very first sync hiccups -- the user
        # can retry via the Sync button; don't fail the whole connect over it.
        pass

    return RedirectResponse(f"{frontend}/smart-calendar?google=connected", status_code=307)


@router.post("/calendar/google/sync", response_model=GoogleSyncResult)
def google_sync_now(payload: GoogleSyncRequest) -> GoogleSyncResult:
    synced, removed, last_synced_at = sync_user_calendar(payload.user_id)
    return GoogleSyncResult(synced=synced, removed=removed, last_synced_at=last_synced_at)


@router.get("/calendar/google/status/{user_id}", response_model=GoogleConnectionStatus)
def google_status(user_id: UUID) -> GoogleConnectionStatus:
    connection = store.get_connection(user_id)
    if not connection:
        return GoogleConnectionStatus(connected=False)
    return GoogleConnectionStatus(
        connected=True,
        connected_at=connection.get("connected_at"),
        last_synced_at=connection.get("last_synced_at"),
    )


@router.delete("/calendar/google/disconnect/{user_id}")
def google_disconnect(user_id: UUID) -> dict:
    connection = store.get_connection(user_id)
    if connection:
        oauth.revoke(connection["access_token"])
        store.delete_connection(user_id)
        supabase = get_supabase()
        supabase.table("calendar_events").delete().eq("user_id", str(user_id)).eq(
            "source", "google_calendar"
        ).execute()
    return {"disconnected": True}
