"""Google OAuth (Authorization Code flow) for connecting a user's Google
Calendar.

This is a server-redirect web flow (google_auth_oauthlib.flow.Flow), not the
CLI-style InstalledAppFlow local-browser flow -- CareShift's backend is a
normal web server, not a script running on the user's machine.

CareShift has no real session/login (demo user-picker only), so the OAuth
`state` param carries the CareShift user_id, HMAC-signed with
GOOGLE_OAUTH_STATE_SECRET so the callback can't be replayed against an
arbitrary user_id.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from datetime import datetime, timezone
from uuid import UUID

from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

from app.config import get_settings
from app.errors import AppError

SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
TOKEN_URI = "https://oauth2.googleapis.com/token"
STATE_TTL_SECONDS = 600  # 10 minutes to complete the consent flow


class OAuthStateError(Exception):
    """Malformed/expired/tampered state -- caught by the callback route and
    turned into a redirect-with-error rather than a raw 500, since the user's
    browser is mid-navigation back from Google."""


def _client_config() -> dict:
    settings = get_settings()
    return {
        "web": {
            "client_id": settings.google_oauth_client_id,
            "client_secret": settings.google_oauth_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": TOKEN_URI,
            "redirect_uris": [settings.google_oauth_redirect_uri],
        }
    }


def _sign_state(payload: dict) -> str:
    settings = get_settings()
    raw = json.dumps(payload, separators=(",", ":")).encode()
    body = base64.urlsafe_b64encode(raw).decode().rstrip("=")
    sig = hmac.new(settings.google_oauth_state_secret.encode(), body.encode(), hashlib.sha256).hexdigest()
    return f"{body}.{sig}"


def _verify_state(state: str) -> dict:
    settings = get_settings()
    try:
        body, sig = state.split(".", 1)
        expected_sig = hmac.new(settings.google_oauth_state_secret.encode(), body.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            raise OAuthStateError("state signature mismatch")
        padded = body + "=" * (-len(body) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded.encode()))
    except OAuthStateError:
        raise
    except Exception as exc:  # noqa: BLE001 -- any parse failure is a bad/tampered state
        raise OAuthStateError(f"malformed state: {exc}") from exc

    if time.time() - payload.get("ts", 0) > STATE_TTL_SECONDS:
        raise OAuthStateError("state expired")
    return payload


def _to_naive_utc(dt: datetime | None) -> datetime | None:
    """google-auth's Credentials.expiry is naive UTC by convention; our DB
    round-trips give back tz-aware datetimes, so normalize on the way in."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(timezone.utc).replace(tzinfo=None)


def build_authorization_url(user_id: UUID) -> str:
    settings = get_settings()
    if not settings.google_oauth_client_id or not settings.google_oauth_client_secret:
        raise AppError(500, "GOOGLE_NOT_CONFIGURED", "Google Calendar OAuth is not configured on this server.")
    if not settings.google_oauth_state_secret:
        raise AppError(500, "GOOGLE_NOT_CONFIGURED", "GOOGLE_OAUTH_STATE_SECRET is not set on this server.")

    flow = Flow.from_client_config(_client_config(), scopes=SCOPES, redirect_uri=settings.google_oauth_redirect_uri)
    state = _sign_state({"user_id": str(user_id), "ts": time.time()})
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",  # force refresh_token issuance even on repeat connects
        state=state,
    )
    return auth_url


def exchange_code(code: str, state: str) -> tuple[UUID, Credentials]:
    """Verifies `state`, exchanges `code` for tokens. Returns (user_id, credentials).
    Raises OAuthStateError for a bad state, AppError for a failed exchange."""
    payload = _verify_state(state)
    settings = get_settings()
    flow = Flow.from_client_config(_client_config(), scopes=SCOPES, redirect_uri=settings.google_oauth_redirect_uri)
    try:
        flow.fetch_token(code=code)
    except Exception as exc:  # noqa: BLE001
        raise AppError(400, "GOOGLE_TOKEN_EXCHANGE_FAILED", f"Could not complete Google sign-in: {exc}") from exc
    return UUID(payload["user_id"]), flow.credentials


def build_credentials(
    access_token: str,
    refresh_token: str | None,
    token_expiry: datetime | None,
) -> Credentials:
    settings = get_settings()
    return Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri=TOKEN_URI,
        client_id=settings.google_oauth_client_id,
        client_secret=settings.google_oauth_client_secret,
        scopes=SCOPES,
        expiry=_to_naive_utc(token_expiry),
    )


def refresh_if_needed(creds: Credentials) -> Credentials:
    """Mutates and returns `creds`. Caller should compare creds.token against
    the previously stored token afterward to decide whether to persist."""
    if not creds.valid:
        if not creds.refresh_token:
            raise AppError(401, "GOOGLE_TOKEN_EXPIRED", "Google Calendar connection expired and cannot be refreshed. Please reconnect.")
        try:
            creds.refresh(GoogleAuthRequest())
        except Exception as exc:  # noqa: BLE001
            raise AppError(401, "GOOGLE_TOKEN_REFRESH_FAILED", f"Google Calendar connection expired: {exc}. Please reconnect.") from exc
    return creds


def revoke(access_token: str) -> None:
    """Best-effort -- local disconnect proceeds regardless of the outcome."""
    import httpx

    try:
        httpx.post(
            "https://oauth2.googleapis.com/revoke",
            params={"token": access_token},
            headers={"content-type": "application/x-www-form-urlencoded"},
            timeout=10.0,
        )
    except Exception:  # noqa: BLE001
        pass
