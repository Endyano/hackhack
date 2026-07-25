from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""

    azure_ai_foundry_endpoint: str = ""
    azure_ai_foundry_api_key: str = ""
    azure_ai_foundry_project: str = ""  # portal reference only; not called directly
    azure_ai_deployment: str = ""
    azure_ai_foundry_timeout_seconds: float = 15.0

    backend_port: int = 8000
    backend_cors_origins: str = "http://localhost:3000"

    # --- Google Calendar OAuth ---
    # See supabase/migration_add_google_calendar.sql and .env.example for setup notes.
    google_oauth_client_id: str = ""
    google_oauth_client_secret: str = ""
    google_oauth_redirect_uri: str = "http://localhost:8000/calendar/google/callback"
    # Signs the OAuth `state` param so the callback can't be replayed against an
    # arbitrary user_id -- this app has no real session/login to rely on instead.
    google_oauth_state_secret: str = ""
    # Where to send the browser back to after the Google OAuth callback.
    frontend_url: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
