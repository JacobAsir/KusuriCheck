"""Gemini-based OCR provider (vision extraction)."""
from __future__ import annotations

import base64
import json

import httpx

from app.core.config import settings
from app.core.errors import OCRProviderError
from app.core.logging import logger
from app.services.ocr.base import OCRProvider, OCRResult


GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-1.5-flash:generateContent"
)

_OCR_PROMPT = (
    "You are an OCR engine. Extract every visible Japanese (and any English) "
    "text from this image of a medicine package, supplement label, or pharmacy "
    "instruction sheet. Preserve line breaks. Do not summarize, translate, or "
    "comment. Output only the raw text."
)


class GeminiOCRProvider(OCRProvider):
    name = "gemini"

    async def extract(self, file_path: str, content_type: str) -> OCRResult:
        if not settings.gemini_api_key:
            raise OCRProviderError("GEMINI_API_KEY not configured.")

        try:
            with open(file_path, "rb") as fh:
                data = fh.read()
        except OSError as exc:
            raise OCRProviderError(f"Could not read upload: {exc}") from exc

        encoded = base64.b64encode(data).decode("ascii")

        body = {
            "contents": [
                {
                    "parts": [
                        {"text": _OCR_PROMPT},
                        {
                            "inlineData": {
                                "mimeType": content_type or "image/jpeg",
                                "data": encoded,
                            }
                        },
                    ]
                }
            ],
            "generationConfig": {"temperature": 0.0, "maxOutputTokens": 2048},
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    GEMINI_ENDPOINT,
                    params={"key": settings.gemini_api_key},
                    json=body,
                )
        except httpx.HTTPError as exc:
            logger.warning("gemini_request_failed", error=str(exc))
            raise OCRProviderError("Gemini OCR request failed.") from exc

        if resp.status_code >= 400:
            logger.warning(
                "gemini_non_200",
                status=resp.status_code,
                body=resp.text[:300],
            )
            raise OCRProviderError(
                f"Gemini OCR returned {resp.status_code}."
            )

        try:
            payload = resp.json()
            text = (
                payload.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )
        except (json.JSONDecodeError, IndexError, KeyError) as exc:
            raise OCRProviderError("Could not parse Gemini OCR response.") from exc

        text = (text or "").strip()
        confidence = 0.85 if len(text) > 30 else 0.3

        return OCRResult(
            raw_text=text,
            blocks=[line for line in text.splitlines() if line.strip()],
            confidence=confidence,
            provider=self.name,
        )
