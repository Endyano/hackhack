"""Deterministic energy+mood -> max-allowed-intensity mapping.

This mirrors CLAUDE.md's architecture for duration bands: the backend
decides what's POSSIBLE, Foundry decides what's most suitable within that.
A small model like phi-4-mini-instruct doesn't reliably follow a soft
"choose easy intensity when energy is low and mood is negative" instruction
buried in a system prompt (verified: it kept returning "moderate" for a
low-energy/negative-mood case). So the cap computed here is enforced as a
hard clamp in validation.py, not just requested in the prompt -- the prompt
line is a best-effort hint, this function is the guarantee.
"""

from __future__ import annotations

INTENSITY_RANK = {"easy": 0, "moderate": 1, "hard": 2}

_LOW_ENERGY_WORDS = {"low", "tired", "exhausted", "drained", "fatigued", "sleepy"}
_HIGH_ENERGY_WORDS = {"high", "energized", "energised", "energetic"}

_NEGATIVE_MOOD_WORDS = {
    "negative", "stressed", "sad", "down", "anxious", "upset", "angry",
    "overwhelmed", "exhausted", "low", "not feeling great", "tired", "depressed",
}
_POSITIVE_MOOD_WORDS = {
    "positive", "happy", "good", "great", "ready", "calm", "energized",
    "energised", "excited", "content",
}


def _energy_level(energy: str | None) -> str:
    if not energy:
        return "medium"
    value = energy.strip().lower()
    if value.isdigit():
        n = int(value)
        if n <= 35:
            return "low"
        if n >= 70:
            return "high"
        return "medium"
    if any(word in value for word in _LOW_ENERGY_WORDS):
        return "low"
    if any(word in value for word in _HIGH_ENERGY_WORDS):
        return "high"
    return "medium"


def _mood_bucket(mood: str | None) -> str:
    if not mood:
        return "neutral"
    value = mood.strip().lower()
    if any(word in value for word in _NEGATIVE_MOOD_WORDS):
        return "negative"
    if any(word in value for word in _POSITIVE_MOOD_WORDS):
        return "positive"
    return "neutral"


def max_allowed_intensity(energy: str | None, mood: str | None) -> str:
    """Returns the strictest intensity ("easy" | "moderate" | "hard") the
    recommendation is allowed to use, given energy + mood together."""
    energy_level = _energy_level(energy)
    mood_state = _mood_bucket(mood)

    if energy_level == "low":
        return "easy"
    if energy_level == "medium":
        return "easy" if mood_state == "negative" else "moderate"
    # energy_level == "high"
    return "moderate" if mood_state == "negative" else "hard"


def clamp_intensity(intensity: str, max_intensity: str) -> str:
    if INTENSITY_RANK.get(intensity, 0) > INTENSITY_RANK[max_intensity]:
        return max_intensity
    return intensity
