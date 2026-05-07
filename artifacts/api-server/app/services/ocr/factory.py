"""OCR provider factory."""
from __future__ import annotations

from app.core.config import settings
from app.core.errors import OCRProviderError
from app.services.ocr.base import OCRProvider
from app.services.ocr.gemini_provider import GeminiOCRProvider


def get_ocr_provider() -> OCRProvider:
    if settings.gemini_api_key:
        return GeminiOCRProvider()
    raise OCRProviderError("GEMINI_API_KEY is not configured. Real OCR requires an API key.")
