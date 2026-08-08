"""Application configuration using pydantic-settings."""

import os
from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    app_name: str = "ForgeAI"
    app_version: str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str = "sqlite+aiosqlite:///data/forgeai.db"
    google_api_key: str = ""
    default_model: str = "gemini-3.5-flash"
    default_temperature: float = 0.7
    default_max_tokens: int = 8192
    checkpoint_db_path: str = "data/checkpoints.db"

    cors_origins: list[str] = ["http://localhost:3000"]
    rate_limit_per_minute: int = 30

    log_level: str = "INFO"
    log_dir: str = "logs"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def _fallback_api_key(self) -> "Settings":
        """Accept GEMINI_API_KEY as a fallback for GOOGLE_API_KEY."""
        if not self.google_api_key:
            self.google_api_key = os.getenv("GEMINI_API_KEY", "")
        return self


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()
