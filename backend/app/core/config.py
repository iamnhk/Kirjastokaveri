from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration pulled from environment."""

    app_name: str = "Kirjastokaveri API"
    environment: str = "development"
    database_url: str = (
        "postgresql+psycopg://kirjastokaveri:kirjastokaveri@localhost:5434/kirjastokaveri"
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
