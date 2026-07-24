"""Thin wrapper around the Azure AI Foundry Agent Service.

The project now calls an existing Foundry agent by ID instead of a direct
OpenAI-compatible model deployment. A short timeout is kept so a slow/flaky
agent call fails fast and the caller can fall back to the hardcoded
recommendation per CLAUDE.md's critical UX rule.
"""

from __future__ import annotations

from typing import Any

from app.config import get_settings
from app.foundry.prompts import SYSTEM_PROMPT, build_user_message


class FoundryError(Exception):
    """Raised when the Foundry agent fails or times out. Callers should fall
    back to the hardcoded recommendation rather than surface this to users."""


_client: Any | None = None
_resolved_agent_id: str | None = None


def _project_endpoint() -> str:
    settings = get_settings()
    return settings.azure_ai_foundry_project_endpoint or settings.azure_ai_foundry_project


def _get_client() -> Any:
    global _client
    if _client is None:
        settings = get_settings()
        endpoint = _project_endpoint()
        if not endpoint:
            raise FoundryError("Azure AI Foundry project endpoint not configured")

        try:
            from azure.ai.agents import AgentsClient
            from azure.identity import DefaultAzureCredential
        except ImportError as exc:
            raise FoundryError(
                "Azure AI Agent SDK not installed. Run pip install -r backend/requirements.txt"
            ) from exc

        _client = AgentsClient(
            endpoint=endpoint,
            credential=DefaultAzureCredential(),
            connection_timeout=settings.azure_ai_foundry_timeout_seconds,
            read_timeout=settings.azure_ai_foundry_timeout_seconds,
        )
    return _client


def _build_agent_prompt(context: dict, usable_minutes: int, avoid_activity: str | None) -> str:
    return "\n\n".join(
        [
            "For this response, follow these instructions exactly:",
            SYSTEM_PROMPT,
            "User context:",
            build_user_message(context, usable_minutes, avoid_activity),
        ]
    )


def _message_text(message: Any) -> str | None:
    text_messages = getattr(message, "text_messages", None) or []
    if text_messages:
        last_text = text_messages[-1]
        text = getattr(last_text, "text", None)
        value = getattr(text, "value", None)
        if value:
            return str(value)

    content = getattr(message, "content", None)
    if isinstance(content, str):
        return content
    return None


def _latest_agent_text(messages: Any) -> str | None:
    for message in reversed(list(messages)):
        role = str(getattr(message, "role", "")).lower()
        if role not in {"agent", "assistant", "messagerole.agent", "messagerole.assistant"}:
            continue
        text = _message_text(message)
        if text:
            return text
    return None


def _resolve_agent_id(client: Any) -> str:
    global _resolved_agent_id

    settings = get_settings()
    if settings.azure_ai_agent_id:
        return settings.azure_ai_agent_id
    if _resolved_agent_id:
        return _resolved_agent_id
    if not settings.azure_ai_agent_name:
        raise FoundryError("Configure AZURE_AI_AGENT_ID or AZURE_AI_AGENT_NAME")

    matches = [
        agent
        for agent in client.list_agents()
        if getattr(agent, "name", None) == settings.azure_ai_agent_name
    ]
    if not matches:
        raise FoundryError(f"Azure AI agent named {settings.azure_ai_agent_name!r} not found")
    if len(matches) > 1:
        raise FoundryError(
            f"Azure AI agent name {settings.azure_ai_agent_name!r} matched {len(matches)} agents; use AZURE_AI_AGENT_ID"
        )

    _resolved_agent_id = str(matches[0].id)
    return _resolved_agent_id


def generate_recommendation_raw(
    context: dict, usable_minutes: int, avoid_activity: str | None = None
) -> str:
    """Calls the Foundry agent and returns the raw text response.

    Raises FoundryError on any failure/timeout -- never raises the
    underlying SDK exception so callers have one thing to catch.
    """
    client = _get_client()
    try:
        from azure.ai.agents.models import ListSortOrder

        agent_id = _resolve_agent_id(client)
        thread = client.threads.create()
        client.messages.create(
            thread_id=thread.id,
            role="user",
            content=_build_agent_prompt(context, usable_minutes, avoid_activity),
        )
        run = client.runs.create_and_process(thread_id=thread.id, agent_id=agent_id)
    except Exception as exc:  # noqa: BLE001 -- any SDK/network failure should fall back, not crash
        raise FoundryError(f"Foundry agent call failed: {exc}") from exc

    status = str(getattr(run, "status", "")).lower()
    if status not in {"completed", "runstatus.completed"}:
        last_error = getattr(run, "last_error", None)
        raise FoundryError(f"Foundry agent run ended with status {status}: {last_error}")

    messages = client.messages.list(thread_id=thread.id, order=ListSortOrder.ASCENDING)
    content = _latest_agent_text(messages)
    if not content:
        raise FoundryError("Foundry agent response had no content")
    return content
