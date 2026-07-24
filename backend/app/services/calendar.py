from __future__ import annotations

from datetime import date as date_cls, datetime, time
from uuid import UUID

from app.models.schemas import CalendarEvent
from app.services.free_slots import DEFAULT_DAY_END, DEFAULT_DAY_START
from app.services.supabase_client import get_supabase


def day_bounds(
    target_date: date_cls,
    day_start: time = DEFAULT_DAY_START,
    day_end: time = DEFAULT_DAY_END,
) -> tuple[datetime, datetime]:
    tz = datetime.now().astimezone().tzinfo
    return (
        datetime.combine(target_date, day_start, tzinfo=tz),
        datetime.combine(target_date, day_end, tzinfo=tz),
    )


def fetch_events(user_id: UUID, start: datetime | None = None, end: datetime | None = None) -> list[CalendarEvent]:
    supabase = get_supabase()
    query = supabase.table("calendar_events").select("*").eq("user_id", str(user_id))
    if start is not None and end is not None:
        # overlap filter: event.start_time < end AND event.end_time > start
        query = query.lt("start_time", end.isoformat()).gt("end_time", start.isoformat())
    query = query.order("start_time")
    result = query.execute()
    return [CalendarEvent.model_validate(row) for row in result.data or []]
