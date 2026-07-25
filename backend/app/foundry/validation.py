"""Parses and validates raw Foundry output against the recommendation
contract. Never let raw model output reach the DB or frontend unchecked."""

from __future__ import annotations

import json
import re

from pydantic import BaseModel, ValidationError

from app.foundry.intensity_rules import clamp_intensity

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


def _coerce(value: str, valid: set[str], synonyms: dict[str, str]) -> str | None:
    """Exact match -> synonym lookup -> substring match (handles multi-word
    variants like "physical activity" or "high intensity") -> give up."""
    normalized = value.strip().lower()
    if normalized in valid:
        return normalized
    if normalized in synonyms:
        return synonyms[normalized]
    for word, mapped in synonyms.items():
        if word in normalized:
            return mapped
    for candidate in valid:
        if candidate in normalized:
            return candidate
    return None


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


def parse_and_validate(
    raw: str, usable_minutes: int, max_intensity: str = "hard"
) -> RawRecommendation:
    data = _extract_json(raw)

    try:
        parsed = RawRecommendation.model_validate(data)
    except ValidationError as exc:
        raise FoundryValidationError(f"Response missing/invalid fields: {exc}") from exc

    category = _coerce(parsed.category, VALID_CATEGORIES, CATEGORY_SYNONYMS)
    if category is None:
        raise FoundryValidationError(f"Invalid category: {parsed.category!r}")

    intensity = _coerce(parsed.intensity, VALID_INTENSITIES, INTENSITY_SYNONYMS)
    if intensity is None:
        raise FoundryValidationError(f"Invalid intensity: {parsed.intensity!r}")
    # The model doesn't reliably follow the energy/mood -> intensity guidance
    # in the prompt on its own (verified: it kept suggesting "moderate" for a
    # low-energy/negative-mood case) -- clamp deterministically as the
    # guarantee, same as duration_minutes below.
    intensity = clamp_intensity(intensity, max_intensity)

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
