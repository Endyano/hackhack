"""Fetches events from the Google Calendar API for a given credentials +
date window. Normalizes all-day vs timed events and preserves timezone.
Purely a data-fetch/normalize layer -- no persistence, no AI."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.errors import AppError


@dataclass
class GoogleEvent:
    external_id: str
    title: str
    start: datetime
    end: datetime
    all_day: bool


def fetch_events(creds: Credentials, time_min: datetime, time_max: datetime) -> list[GoogleEvent]:
    try:
        service = build("calendar", "v3", credentials=creds)
        result = (
            service.events()
            .list(
                calendarId="primary",
                timeMin=time_min.isoformat(),
                timeMax=time_max.isoformat(),
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )
    except Exception as exc:  # noqa: BLE001 -- any Google API failure surfaces as a clean AppError
        raise AppError(502, "GOOGLE_CALENDAR_FETCH_FAILED", f"Could not fetch Google Calendar events: {exc}") from exc

    local_tz = time_min.tzinfo
    events: list[GoogleEvent] = []
    for item in result.get("items", []):
        start_info = item.get("start") or {}
        end_info = item.get("end") or {}
        all_day = "date" in start_info and "dateTime" not in start_info

        if all_day:
            start = datetime.fromisoformat(start_info["date"]).replace(tzinfo=local_tz)
            end = datetime.fromisoformat(end_info.get("date", start_info["date"])).replace(tzinfo=local_tz)
        else:
            start = datetime.fromisoformat(start_info["dateTime"]).astimezone(local_tz)
            end = datetime.fromisoformat(end_info["dateTime"]).astimezone(local_tz)

        events.append(
            GoogleEvent(
                external_id=item["id"],
                title=item.get("summary") or "Busy",
                start=start,
                end=end,
                all_day=all_day,
            )
        )
    return events
