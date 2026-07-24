"""Seeds the Eric/Daniel demo scenario described in CLAUDE.md.

Run from the backend/ directory with the venv active and .env configured:

    python -m seed.seed_data

Idempotent: deletes any existing demo users by email (cascades to their
related rows) before re-inserting, so this is safe to re-run before a demo.

Calendar events are dated "today" (relative to when this script runs) so the
free-slot endpoints produce a live, demoable result no matter what day the
hackathon judging happens on.
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.supabase_client import get_supabase  # noqa: E402

ERIC_EMAIL = "eric@careshift.demo"
DANIEL_EMAIL = "daniel@careshift.demo"


def _today_at(hour: int, minute: int, day_offset: int = 0) -> str:
    tz = datetime.now().astimezone().tzinfo
    dt = datetime.now(tz).replace(hour=hour, minute=minute, second=0, microsecond=0)
    dt += timedelta(days=day_offset)
    return dt.isoformat()


def main() -> None:
    supabase = get_supabase()

    # --- Clean slate for demo users (cascades to prefs/events/check-ins/etc.) ---
    existing = (
        supabase.table("users").select("id, email").in_("email", [ERIC_EMAIL, DANIEL_EMAIL]).execute()
    )
    existing_ids = [row["id"] for row in existing.data or []]
    if existing_ids:
        supabase.table("users").delete().in_("id", existing_ids).execute()

    # --- USERS ---
    users_result = (
        supabase.table("users")
        .insert(
            [
                {
                    "name": "Eric",
                    "email": ERIC_EMAIL,
                    "experience_level": "beginner",
                    "primary_goal": "improve endurance",
                    "current_location": "campus",
                    "carematch_enabled": True,
                },
                {
                    "name": "Daniel",
                    "email": DANIEL_EMAIL,
                    "experience_level": "intermediate",
                    "primary_goal": "stay active",
                    "current_location": "campus",
                    "carematch_enabled": True,
                },
            ]
        )
        .execute()
    )
    by_email = {row["email"]: row["id"] for row in users_result.data}
    eric_id = by_email[ERIC_EMAIL]
    daniel_id = by_email[DANIEL_EMAIL]

    # --- USER_PREFERENCES ---
    supabase.table("user_preferences").insert(
        [
            {
                "user_id": eric_id,
                "preferred_activities": ["running", "stretching"],
                "disliked_activities": ["swimming"],
                "friend_match_pref": "running partner",
            },
            {
                "user_id": daniel_id,
                "preferred_activities": ["running", "basketball"],
                "disliked_activities": [],
                "friend_match_pref": "running partner",
            },
        ]
    ).execute()

    # --- CALENDAR_EVENTS (today) ---
    # Eric: class 2-4PM, dinner 6:30-7:30PM -> leaves an afternoon gap around 4-6PM
    # once free-slot buffering is applied.
    supabase.table("calendar_events").insert(
        [
            {
                "user_id": eric_id,
                "title": "Class",
                "start_time": _today_at(14, 0),
                "end_time": _today_at(16, 0),
                "event_type": "class",
            },
            {
                "user_id": eric_id,
                "title": "Dinner",
                "start_time": _today_at(18, 30),
                "end_time": _today_at(19, 30),
                "event_type": "personal",
            },
            # Daniel: lab 1-4PM, study group 5:45-7PM -> free late afternoon,
            # overlapping Eric's gap.
            {
                "user_id": daniel_id,
                "title": "Lab",
                "start_time": _today_at(13, 0),
                "end_time": _today_at(16, 0),
                "event_type": "class",
            },
            {
                "user_id": daniel_id,
                "title": "Study group",
                "start_time": _today_at(17, 45),
                "end_time": _today_at(19, 0),
                "event_type": "personal",
            },
        ]
    ).execute()

    # --- DAILY_CHECK_INS ---
    supabase.table("daily_check_ins").insert(
        [
            {
                "user_id": eric_id,
                "mood": "stressed",
                "energy_level": "medium",
                "physical_readiness": "normal",
                "location": "campus",
            },
            {
                "user_id": daniel_id,
                "mood": "calm",
                "energy_level": "high",
                "physical_readiness": "normal",
                "location": "campus",
            },
        ]
    ).execute()

    # --- ACTIVITY_RECOMMENDATIONS + ACTIVITY_HISTORY ---
    # Eric did a leg workout yesterday -> recommendation-context should surface
    # this as "recent_activity" so Foundry knows to suggest something easier today.
    leg_workout = (
        supabase.table("activity_recommendations")
        .insert(
            {
                "user_id": eric_id,
                "activity_name": "Leg workout",
                "category": "physical",
                "start_time": _today_at(17, 0, day_offset=-1),
                "duration_minutes": 45,
                "intensity": "moderate",
                "reason": "Seed data for demo history",
                "status": "completed",
            }
        )
        .execute()
    )
    leg_workout_id = leg_workout.data[0]["id"]

    supabase.table("activity_history").insert(
        {
            "user_id": eric_id,
            "recommendation_id": leg_workout_id,
            "completion_status": "completed",
            "feedback": "Felt good, legs a bit sore after",
            "completed_at": _today_at(18, 0, day_offset=-1),
        }
    ).execute()

    # --- FRIENDSHIPS (bidirectional for simple querying) ---
    supabase.table("friendships").insert(
        [
            {
                "user_id": eric_id,
                "friend_id": daniel_id,
                "status": "accepted",
                "carematch_enabled": True,
            },
            {
                "user_id": daniel_id,
                "friend_id": eric_id,
                "status": "accepted",
                "carematch_enabled": True,
            },
        ]
    ).execute()

    print("Seeded demo data:")
    print(f"  Eric:   {eric_id}")
    print(f"  Daniel: {daniel_id}")


if __name__ == "__main__":
    main()
