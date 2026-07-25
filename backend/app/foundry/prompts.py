"""System prompt + duration-band filtering for the Foundry recommendation call.

Backend decides what is POSSIBLE (which duration bands fit in the free
period); Foundry decides what is MOST SUITABLE (which specific activity,
category, and intensity within those bands). See CLAUDE.md's division of
responsibility.
"""

from __future__ import annotations

from typing import Literal

# (min_minutes, max_minutes, example activities across all three categories) --
# duration bands from CLAUDE.md, expanded with mental/nutritional variety so
# the model doesn't default to "brisk walk" for everything.
DURATION_BANDS = [
    (
        5,
        10,
        "physical: short walk, posture reset; "
        "mental: box breathing, 2-minute meditation, gratitude journaling; "
        "nutritional: hydration break, mindful snack",
    ),
    (
        20,
        30,
        "physical: brisk walk, short jog, bodyweight circuit, easy bike ride; "
        "mental: guided meditation, light yoga flow, journaling session; "
        "nutritional: light snack prep, mindful meal",
    ),
    (
        30,
        60,
        "physical: gym session, running session, swim, longer walk, full mobility workout, dance workout; "
        "mental: reflection/breathwork session, longer yoga practice; "
        "nutritional: meal prep, cooking a healthy meal",
    ),
    (
        60,
        120,
        "physical: full gym workout, endurance run, team sport, group fitness class, hike; "
        "mental: nature walk with reflection, extended mindfulness practice; "
        "nutritional: meal prep + recovery, grocery shopping + cooking",
    ),
]


def usable_bands(usable_minutes: int) -> list[tuple[int, int, str]]:
    """A band is usable if its lower bound fits in the available time."""
    return [
        (lo, min(hi, usable_minutes), examples)
        for lo, hi, examples in DURATION_BANDS
        if lo <= usable_minutes
    ]


SYSTEM_PROMPT = """You are the CareShift wellbeing planner. Given a user's current \
mood, energy, goal, experience level, recent activity, and how much free time they \
have, recommend exactly ONE specific activity that best fits their day right now.

Rules:
- The user message tells you the maximum allowed intensity for this specific request \
(easy, moderate, or hard). You MUST NOT exceed it -- treat it as a hard ceiling, not a \
suggestion. Picking anything stricter (e.g. "easy" when "moderate" is allowed) is fine \
if the user's mood/energy still feels low; picking anything looser is not allowed.
- If recent_activity shows the user is fatigued or sore from something similar, prefer \
an easier intensity and/or a different category even if a higher intensity is allowed.
- Pick ONE concrete, specific activity (2-5 words, e.g. "easy 20-minute jog" or \
"5-minute box breathing"). Never copy a band description or list several options.
- category must be exactly one of: mental, physical, nutritional
- intensity must be exactly one of: easy, moderate, hard
- duration_minutes must be a number and must NOT exceed the usable minutes given
- If preferred_activities are listed, strongly favor something matching one of them \
when it fits the rules above. Never recommend anything in disliked_activities, or a \
close variant of it.
- Avoid repeating whatever is in recent_activity.
- reason must be one short sentence written to the user ("You have...", "Since \
you...") that names the SPECIFIC thing that actually drove the choice -- their mood, \
energy, recent activity, or a matching preference -- whenever one of those applies. \
Prefer a specific reason over a generic one.

Your entire response must be ONLY a single JSON object with EXACTLY these five keys and \
no others: activity, category, duration_minutes, intensity, reason.

Example of a correctly formatted response (values are illustrative only, base your real \
answer on the actual context given):
{"activity": "5-minute box breathing", "category": "mental", "duration_minutes": 5, \
"intensity": "easy", "reason": "Your energy is low and you're feeling stressed, so a \
short breathing exercise helps you reset without draining you further."}"""


def _describe(value: str | None, label: str) -> str | None:
    return f"{label} {value}" if value else None


PreviousAction = Literal["shorten", "replace", "skip"]


def build_user_message(
    context: dict,
    usable_minutes: int,
    previous_activity: str | None = None,
    previous_action: PreviousAction | None = None,
    max_intensity: str = "hard",
) -> str:
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
        f"{free_period.get('end')}."
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

    sentence_8 = ""
    if previous_action == "shorten" and previous_activity:
        sentence_8 = (
            f'The user liked the idea of "{previous_activity}" but wants something that '
            "takes less time -- keep a similar spirit if you can, but it must fit "
            "strictly within the time available."
        )
    elif previous_action == "replace" and previous_activity:
        sentence_8 = (
            f'The user already saw and rejected this suggestion, so recommend something '
            f'else instead: "{previous_activity}".'
        )
    elif previous_action == "skip" and previous_activity:
        sentence_8 = (
            f'The user skipped "{previous_activity}" entirely and did not want to do it -- '
            "offer a noticeably different option (a different category or something much "
            "easier/lower-effort)."
        )

    intensity_directive = (
        f'The maximum allowed intensity for this recommendation is "{max_intensity}" -- '
        f"do not exceed it."
    )

    closing = (
        "Return the JSON object now, using exactly the five keys activity, category, "
        "duration_minutes, intensity, reason -- nothing else."
    )

    return " ".join(
        s
        for s in [
            sentence_1,
            sentence_2,
            sentence_3,
            sentence_4,
            sentence_5,
            sentence_6,
            sentence_7,
            sentence_8,
            intensity_directive,
            closing,
        ]
        if s
    )
