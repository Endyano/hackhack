"""Thin wrapper around the Azure AI Foundry model deployment.

Uses the deployed model's OpenAI-compatible v1 endpoint (no Agent
threads/runs -- this project's Foundry setup is a direct chat-completions
deployment, not the Agent Service, since the Agent Service requires Entra ID
auth against the tenant that owns the resource, which wasn't reachable). A
short timeout is enforced so a slow/flaky call fails fast and the caller can
fall back to the hardcoded recommendation per CLAUDE.md's critical UX rule.
"""

from __future__ import annotations

from openai import OpenAI

from app.config import get_settings
from app.foundry.prompts import SYSTEM_PROMPT, PreviousAction, build_user_message


class FoundryError(Exception):
    """Raised when the Foundry call fails or times out. Callers should fall
    back to the hardcoded recommendation rather than surface this to users."""


_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.azure_ai_foundry_endpoint or not settings.azure_ai_foundry_api_key:
            raise FoundryError("Azure AI Foundry endpoint/key not configured")
        _client = OpenAI(
            base_url=settings.azure_ai_foundry_endpoint,
            api_key=settings.azure_ai_foundry_api_key,
            timeout=settings.azure_ai_foundry_timeout_seconds,
        )
    return _client


def generate_recommendation_raw(
    context: dict,
    usable_minutes: int,
    previous_activity: str | None = None,
    previous_action: PreviousAction | None = None,
    max_intensity: str = "hard",
) -> str:
    """Calls the Foundry model and returns the raw text response.

    Raises FoundryError on any failure/timeout -- never raises the
    underlying SDK exception so callers have one thing to catch.
    """
    settings = get_settings()
    if not settings.azure_ai_deployment:
        raise FoundryError("AZURE_AI_DEPLOYMENT not configured")

    client = _get_client()
    try:
        response = client.chat.completions.create(
            model=settings.azure_ai_deployment,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": build_user_message(
                        context, usable_minutes, previous_activity, previous_action, max_intensity
                    ),
                },
            ],
            temperature=0.3,
            max_tokens=300,
            response_format={"type": "json_object"},
            timeout=settings.azure_ai_foundry_timeout_seconds,
        )
    except Exception as exc:  # noqa: BLE001 -- any SDK/network failure should fall back, not crash
        raise FoundryError(f"Foundry call failed: {exc}") from exc

    content = response.choices[0].message.content if response.choices else None
    if not content:
        raise FoundryError("Foundry response had no content")
    return content
