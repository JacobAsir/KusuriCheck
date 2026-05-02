"""OCR provider factory."""
from __future__ import annotations

from app.core.config import settings
from app.services.ocr.base import OCRProvider
from app.services.ocr.gemini_provider import GeminiOCRProvider
from app.services.ocr.mock_provider import MockOCRProvider


def get_ocr_provider() -> OCRProvider:
    if settings.gemini_api_key:
        return GeminiOCRProvider()
    return MockOCRProvider()


# Module-level singleton mock (used for demo fixtures regardless of provider)
mock_ocr = MockOCRProvider()
