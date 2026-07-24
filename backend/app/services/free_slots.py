"""Deterministic free-slot detection: gaps between calendar events, minus prep
buffers, minus gaps too short to be useful. No AI involved -- this is exactly
the kind of thing CLAUDE.md says the backend decides, not Foundry."""

from __future__ import annotations

from datetime import datetime, time, timedelta

from app.models.schemas import CalendarEvent, FreeSlot

DEFAULT_BUFFER_MINUTES = 15
DEFAULT_MIN_SLOT_MINUTES = 10
DEFAULT_DAY_START = time(7, 0)
DEFAULT_DAY_END = time(23, 0)


def compute_free_slots(
    events: list[CalendarEvent],
    day_start: datetime,
    day_end: datetime,
    buffer_minutes: int = DEFAULT_BUFFER_MINUTES,
    min_slot_minutes: int = DEFAULT_MIN_SLOT_MINUTES,
) -> list[FreeSlot]:
    """Compute free slots within [day_start, day_end], applying a prep buffer
    around each event and dropping any resulting gap shorter than
    min_slot_minutes.

    `events` should already be filtered to the relevant day/user; only events
    overlapping [day_start, day_end] are considered.
    """
    buffer = timedelta(minutes=buffer_minutes)

    # Buffer + clip each event to the day window, merge overlaps, sort.
    busy_ranges: list[tuple[datetime, datetime]] = []
    for event in sorted(events, key=lambda e: e.start_time):
        start = max(event.start_time - buffer, day_start)
        end = min(event.end_time + buffer, day_end)
        if end <= day_start or start >= day_end:
            continue
        busy_ranges.append((start, end))

    merged: list[list[datetime]] = []
    for start, end in sorted(busy_ranges, key=lambda r: r[0]):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])

    slots: list[FreeSlot] = []
    cursor = day_start
    for start, end in merged:
        if start > cursor:
            _maybe_add_slot(slots, cursor, start, min_slot_minutes)
        cursor = max(cursor, end)

    if cursor < day_end:
        _maybe_add_slot(slots, cursor, day_end, min_slot_minutes)

    return slots


def _maybe_add_slot(
    slots: list[FreeSlot], start: datetime, end: datetime, min_slot_minutes: int
) -> None:
    usable_minutes = int((end - start).total_seconds() // 60)
    if usable_minutes >= min_slot_minutes:
        slots.append(FreeSlot(start_time=start, end_time=end, usable_minutes=usable_minutes))
