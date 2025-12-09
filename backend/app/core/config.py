from functools import lru_cache
from json import JSONDecodeError, loads

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration pulled from environment."""

    app_name: str = "Kirjastokaveri API"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = False

    # Database settings
    database_url: str = (
        "postgresql+psycopg://kirjastokaveri:kirjastokaveri@localhost:5434/kirjastokaveri"
    )

    # Finna API settings
    finna_base_url: str = "https://api.finna.fi"
    finna_availability_base_url: str = "https://www.finna.fi"
    finna_search_endpoint: str = "/api/v1/search"
    finna_availability_endpoint: str = "/AJAX/JSON"
    default_search_limit: int = 20
    request_timeout_seconds: float = 30.0  # Increased from 10 to 30 seconds

    # Cache settings
    redis_url: str | None = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 300

    # Authentication settings
    secret_key: str = "your-secret-key-change-in-production-min-32-chars-long"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS settings
    cors_allow_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]
    cors_allow_origin_regex: str | None = None

    # Logging
    log_level: str = "INFO"

    # Scheduler settings for availability monitoring
    scheduler_enabled: bool = True
    availability_check_interval_minutes: int = 2  # Check every 2 minutes (for testing)
    availability_check_initial_delay_seconds: int = 30  # Wait 30 seconds before first check
    availability_check_batch_size: int = 50  # Process 50 items per run

    @field_validator("cors_allow_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: list[str] | str) -> list[str]:
        if isinstance(value, str):
            try:
                parsed = loads(value)
            except JSONDecodeError:
                parsed = value.split(",")

            if isinstance(parsed, str):
                parsed = [parsed]

            return [str(origin).strip() for origin in parsed if str(origin).strip()]
        return value

    @property
    def DATABASE_URL(self) -> str:
        """Uppercase alias for database_url."""
        return self.database_url

    @property
    def DEBUG(self) -> bool:
        """Uppercase alias for debug."""
        return self.debug

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="KIRJASTO_",
        extra="allow",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()


# Create a global settings instance for convenience
settings = get_settings()
