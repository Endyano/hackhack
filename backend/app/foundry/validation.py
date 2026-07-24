"""Parses and validates raw Foundry output against the recommendation
contract. Never let raw model output reach the DB or frontend unchecked."""

from __future__ import annotations

import json
import re

from pydantic import BaseModel, ValidationError

VALID_CATEGORIES = {"mental", "physical", "nutritional"}
VALID_INTENSITIES = {"easy", "moderate", "hard"}

# Small models often reach for a plausible synonym instead of the exact enum
# value (e.g. "cardiovascular" instead of "physical"). Coerce known synonyms
# before rejecting outright.
CATEGORY_SYNONYMS = {
    "cardiovascular": "physical",
    "cardio": "physical",
    "fitness": "physical",
    "exercise": "physical",
    "workout": "physical",
    "sport": "physical",
    "sports": "physical",
    "movement": "physical",
    "endurance": "physical",
    "training": "physical",
    "aerobic": "physical",
    "running": "physical",
    "run": "physical",
    "walking": "physical",
    "strength": "physical",
    "nutrition": "nutritional",
    "food": "nutritional",
    "meal": "nutritional",
    "diet": "nutritional",
    "eating": "nutritional",
    "hydration": "nutritional",
    "mindfulness": "mental",
    "meditation": "mental",
    "relaxation": "mental",
    "mind": "mental",
    "emotional": "mental",
    "cognitive": "mental",
    "stress relief": "mental",
}

INTENSITY_SYNONYMS = {
    "light": "easy",
    "low": "easy",
    "gentle": "easy",
    "medium": "moderate",
    "mid": "moderate",
    "intense": "hard",
    "high": "hard",
    "vigorous": "hard",
    "difficult": "hard",
}


class FoundryValidationError(Exception):
    """Raised when the model's output can't be coerced into a valid
    recommendation. Callers should fall back to the hardcoded recommendation."""


class RawRecommendation(BaseModel):
    activity: str
    category: str
    duration_minutes: int
    intensity: str
    reason: str


def _extract_json(raw: str) -> dict:
    raw = raw.strip()
    # Strip ```json ... ``` fences if the model added them despite instructions.
    fenced = re.match(r"^```(?:json)?\s*(.*?)\s*```$", raw, re.DOTALL)
    if fenced:
        raw = fenced.group(1)

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Last resort: grab the first {...} block in the text.
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise FoundryValidationError("No JSON object found in Foundry response")
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError as exc:
        raise FoundryValidationError(f"Malformed JSON from Foundry: {exc}") from exc


def parse_and_validate(raw: str, usable_minutes: int) -> RawRecommendation:
    data = _extract_json(raw)

    try:
        parsed = RawRecommendation.model_validate(data)
    except ValidationError as exc:
        raise FoundryValidationError(f"Response missing/invalid fields: {exc}") from exc

    category = parsed.category.strip().lower()
    category = CATEGORY_SYNONYMS.get(category, category)
    if category not in VALID_CATEGORIES:
        raise FoundryValidationError(f"Invalid category: {parsed.category!r}")

    intensity = parsed.intensity.strip().lower()
    intensity = INTENSITY_SYNONYMS.get(intensity, intensity)
    if intensity not in VALID_INTENSITIES:
        raise FoundryValidationError(f"Invalid intensity: {parsed.intensity!r}")

    if parsed.duration_minutes <= 0 or parsed.duration_minutes > usable_minutes:
        raise FoundryValidationError(
            f"duration_minutes {parsed.duration_minutes} does not fit usable_minutes {usable_minutes}"
        )

    if not parsed.activity.strip() or not parsed.reason.strip():
        raise FoundryValidationError("activity/reason must be non-empty")

    return RawRecommendation(
        activity=parsed.activity.strip(),
        category=category,
        duration_minutes=parsed.duration_minutes,
        intensity=intensity,
        reason=parsed.reason.strip(),
    )
