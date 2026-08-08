"""Application configuration using pydantic-settings."""

from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    app_name: str = "ForgeAI"
    app_version: str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str = "sqlite+aiosqlite:///data/forgeai.db"

    # Accepts GROQ_API_KEY (primary) or GOOGLE_API_KEY / GEMINI_API_KEY (legacy)
    groq_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("GROQ_API_KEY"),
    )
    google_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("GOOGLE_API_KEY", "GEMINI_API_KEY"),
    )

    default_model: str = "llama-3.3-70b-versatile"
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

    @property
    def active_api_key(self) -> str:
        """Return whichever API key is configured (Groq preferred)."""
        return self.groq_api_key or self.google_api_key


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()
