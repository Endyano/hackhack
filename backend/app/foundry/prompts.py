"""System prompt + duration-band filtering for the Foundry recommendation call.

Backend decides what is POSSIBLE (which duration bands fit in the free
period); Foundry decides what is MOST SUITABLE (which specific activity,
category, and intensity within those bands). See CLAUDE.md's division of
responsibility.
"""

from __future__ import annotations

# (min_minutes, max_minutes, label, example activities) -- from CLAUDE.md
DURATION_BANDS = [
    (5, 10, "stretching, hydration break, breathing exercise, posture reset, short walk"),
    (20, 30, "brisk walk, short run, bodyweight workout, mobility routine, mental recharge"),
    (30, 60, "gym session, running session, longer walk, full mobility workout, meal prep"),
    (60, 120, "full gym workout, endurance run, sports activity, group exercise, meal prep + recovery"),
]


def usable_bands(usable_minutes: int) -> list[tuple[int, int, str]]:
    """A band is usable if its lower bound fits in the available time."""
    return [
        (lo, min(hi, usable_minutes), examples)
        for lo, hi, examples in DURATION_BANDS
        if lo <= usable_minutes
    ]


SYSTEM_PROMPT = """You are the CareShift wellbeing planner. Given a user's current \
mood/energy/readiness, goal, experience level, recent activity, and how much free time \
they have, recommend exactly ONE specific activity that best fits their day right now.

Rules:
- Pick ONE concrete, specific activity (2-5 words, e.g. "easy 20-minute jog"). Never \
copy a band description or list several options -- one single activity only.
- category must be exactly one of: mental, physical, nutritional
- intensity must be exactly one of: easy, moderate, hard
- duration_minutes must be a number, must NOT exceed the usable minutes given in the \
context, and should fit inside one of the duration bands provided
- If the user's recent_activity suggests fatigue in a body area (e.g. "leg workout \
yesterday"), avoid recommending something that stresses the same area again -- prefer \
easier intensity or a different category
- Avoid repeating whatever is in recent_activity
- reason must be one short sentence, written to the user ("You have..."), justifying the \
choice using their actual energy/mood/time context

Your entire response must be ONLY a single JSON object with EXACTLY these five keys and \
no others: activity, category, duration_minutes, intensity, reason.

Example of a correctly formatted response (values are illustrative only, base your real \
answer on the actual context given):
{"activity": "easy 30-minute run", "category": "physical", "duration_minutes": 30, \
"intensity": "easy", "reason": "You have enough free time and your energy is medium, so \
a light run fits well without overloading you."}"""


def _describe(value: str | None, label: str) -> str | None:
    return f"{label} {value}" if value else None


def build_user_message(context: dict, usable_minutes: int, avoid_activity: str | None = None) -> str:
    """Deliberately phrased as a natural-language paragraph, not a dict/bullet
    dump: this small model tends to mirror whatever structure the user message
    uses, so JSON-ish or list-shaped input leads it to echo that shape back
    instead of following the system prompt's schema."""
    free_period = context.get("free_period") or {}
    bands = usable_bands(usable_minutes)
    band_descriptions = [
        f"about {lo}-{hi} minutes (e.g. {examples})" for lo, hi, examples in bands
    ]

    parts = [
        _describe(context.get("mood"), "The user feels"),
        _describe(context.get("energy"), "with"),
    ]
    sentence_1 = " ".join(p for p in parts if p)
    if sentence_1:
        sentence_1 += " energy." if context.get("energy") else "."

    sentence_2 = (
        f"They are {context.get('experience')} level, and their goal is {context.get('goal')}."
        if context.get("experience") or context.get("goal")
        else ""
    )
    sentence_3 = (
        f"Their most recent activity was: {context.get('recent_activity')}."
        if context.get("recent_activity")
        else ""
    )
    sentence_4 = (
        f"They are free for {usable_minutes} minutes, from {free_period.get('start')} to "
        f"{free_period.get('end')}"
        + (f", at {context.get('location')}." if context.get("location") else ".")
    )
    sentence_5 = (
        "Given that time, a suitable activity would take " + "; or ".join(band_descriptions) + "."
        if band_descriptions
        else ""
    )
    prefs = context.get("preferred_activities") or []
    dislikes = context.get("disliked_activities") or []
    sentence_6 = f"They generally enjoy: {', '.join(prefs)}." if prefs else ""
    sentence_7 = f"They dislike: {', '.join(dislikes)}." if dislikes else ""
    sentence_8 = (
        f"They already saw and rejected this suggestion, so recommend something else instead: "
        f"{avoid_activity}."
        if avoid_activity
        else ""
    )

    closing = (
        "Return the JSON object now, using exactly the five keys activity, category, "
        "duration_minutes, intensity, reason -- nothing else."
    )

    return " ".join(
        s
        for s in [sentence_1, sentence_2, sentence_3, sentence_4, sentence_5, sentence_6, sentence_7, sentence_8, closing]
        if s
    )
