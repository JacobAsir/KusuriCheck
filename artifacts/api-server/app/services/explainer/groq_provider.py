"""Groq-hosted LLM explainer for plain-language bilingual summaries.

Strictly grounded in extracted evidence - the prompt forbids invention.
"""
from __future__ import annotations

import json

import httpx

from app.core.config import settings
from app.core.errors import ExplainerProviderError
from app.core.logging import logger
from app.services.explainer.base import (
    ExplainerInput,
    ExplainerOutput,
    ExplainerProvider,
)


GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"


_SYSTEM_PROMPT = (
    "You are a careful Japanese-medicine label reader. You receive structured "
    "fields and evidence lines extracted from an OCR pass of a Japanese "
    "OTC medicine, supplement, or pharmacy instruction sheet. "
    "Your job is to write a plain-language summary in Japanese AND in English. "
    "Strict rules:\n"
    "1. NEVER invent a use, dosage, ingredient, warning, or interaction that "
    "is not present in the provided fields or evidence.\n"
    "2. NEVER provide diagnosis, treatment recommendation, or emergency advice.\n"
    "3. If a field is missing, say so explicitly. Do NOT guess.\n"
    "4. Always remind the user to confirm with a pharmacist or doctor.\n"
    "5. Output JSON with two keys exactly: summary_ja and summary_en.\n"
    "6. Each summary should be 3 to 6 short sentences."
)


class GroqExplainer(ExplainerProvider):
    name = "groq"

    async def explain(self, payload: ExplainerInput) -> ExplainerOutput:
        if not settings.groq_api_key:
            raise ExplainerProviderError("GROQ_API_KEY not configured.")

        user_payload = {
            "content_type": payload.content_type,
            "product_name": payload.product_name,
            "sections": payload.sections.model_dump(),
            "evidence": [e.model_dump() for e in payload.evidence],
            "audience_mode": payload.preferences.audience_mode,
            "language_preference": payload.preferences.language,
            "escalation_level": payload.escalation_level,
        }

        body = {
            "model": settings.groq_model,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": _SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        "Here are the extracted fields. Produce summary_ja and "
                        "summary_en strictly grounded in this data:\n\n"
                        + json.dumps(user_payload, ensure_ascii=False, indent=2)
                    ),
                },
            ],
        }

        headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(GROQ_ENDPOINT, headers=headers, json=body)
        except httpx.HTTPError as exc:
            logger.warning("groq_request_failed", error=str(exc))
            raise ExplainerProviderError("Groq request failed.") from exc

        if resp.status_code >= 400:
            logger.warning(
                "groq_non_200",
                status=resp.status_code,
                body=resp.text[:300],
            )
            raise ExplainerProviderError(f"Groq returned {resp.status_code}.")

        try:
            payload_json = resp.json()
            text = payload_json["choices"][0]["message"]["content"]
            parsed = json.loads(text)
            summary_ja = parsed.get("summary_ja") or ""
            summary_en = parsed.get("summary_en") or ""
        except (json.JSONDecodeError, KeyError, IndexError) as exc:
            raise ExplainerProviderError("Could not parse Groq response.") from exc

        if not summary_ja or not summary_en:
            raise ExplainerProviderError("Groq returned empty summary fields.")

        return ExplainerOutput(summary_ja=summary_ja, summary_en=summary_en)
