"""Central application settings, loaded from environment variables."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = "development"
    log_level: str = "INFO"
    version: str = "0.1.0"

    max_upload_mb: int = 10
    allowed_file_types: str = "image/jpeg,image/png,image/webp,application/pdf"

    gemini_api_key: str | None = None

    @property
    def allowed_mime_set(self) -> set[str]:
        return {t.strip() for t in self.allowed_file_types.split(",") if t.strip()}

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def ocr_mode(self) -> str:
        return "gemini" if self.gemini_api_key else "mock"


settings = Settings()
