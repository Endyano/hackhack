from datetime import date as date_cls, time
from uuid import UUID

from fastapi import APIRouter, Query

from app.models.schemas import CalendarEvent, FreeSlot
from app.services.calendar import day_bounds, fetch_events
from app.services.free_slots import (
    DEFAULT_BUFFER_MINUTES,
    DEFAULT_MIN_SLOT_MINUTES,
    compute_free_slots,
)

router = APIRouter(tags=["calendar"])


@router.get("/calendar/{user_id}", response_model=list[CalendarEvent])
def get_calendar(user_id: UUID, date: date_cls | None = Query(default=None)) -> list[CalendarEvent]:
    if date is None:
        return fetch_events(user_id)
    start, end = day_bounds(date, time.min, time.max)
    return fetch_events(user_id, start, end)


@router.get("/calendar/{user_id}/free-slots", response_model=list[FreeSlot])
def get_free_slots(
    user_id: UUID,
    date: date_cls | None = Query(default=None, description="Defaults to today"),
    day_start: time = Query(default=None),
    day_end: time = Query(default=None),
    buffer_minutes: int = Query(default=DEFAULT_BUFFER_MINUTES, ge=0),
    min_slot_minutes: int = Query(default=DEFAULT_MIN_SLOT_MINUTES, ge=0),
) -> list[FreeSlot]:
    target_date = date or date_cls.today()
    start_bound, end_bound = day_bounds(
        target_date,
        day_start or time(7, 0),
        day_end or time(23, 0),
    )
    events = fetch_events(user_id, start_bound, end_bound)
    return compute_free_slots(
        events,
        day_start=start_bound,
        day_end=end_bound,
        buffer_minutes=buffer_minutes,
        min_slot_minutes=min_slot_minutes,
    )
