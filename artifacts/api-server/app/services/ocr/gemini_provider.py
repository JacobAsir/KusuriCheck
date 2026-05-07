import base64
import json
import httpx
from typing import Optional

from app.core.logging import logger
from app.core.config import settings
from app.core.errors import OCRProviderError
from app.schemas.request import UserPreferences
from app.services.ocr.base import OCRProvider, OCRResult, ParsedSections

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"

_SINGLE_PASS_PROMPT = """
You are a medical OCR specialist. Analyze this Japanese medicine label/instruction.
Extract and translate the following into a STRICT JSON format.

FIELDS TO EXTRACT:
1. 'raw_text': Full transcription of all visible text in Japanese.
2. 'product_name': The main brand/product name in Japanese.
3. 'product_name_en': The brand/product name translated or transliterated to English.
4. 'sections_ja': {
     'intended_use': Japanese text for indications/symptoms,
     'dosage': Japanese text for how to take it,
     'warnings': List of Japanese strings for cautions/contraindications,
     'ingredients': List of Japanese strings for active components,
     'storage': Japanese text for storage instructions,
     'age_notes': Japanese text for age restrictions or guidance
   }
5. 'sections_en': {
     'intended_use': English translation,
     'dosage': English translation,
     'warnings': List of English translations,
     'ingredients': List of English translations,
     'storage': English translation,
     'age_notes': English translation
   }
6. 'summary_ja': A concise 2-3 sentence overview in Japanese.
7. 'summary_en': A concise 2-3 sentence overview in English.

STRICT RULES:
- Output ONLY the JSON object.
- DO NOT include ANY markdown formatting (no ```json).
- LANGUAGE COMPLIANCE: The 'en' fields MUST NOT contain any Japanese characters. If a term has no English equivalent, transliterate it (e.g., 'Ohta-san' instead of '太田さん').
- TONE AND AUDIENCE: You must write the summaries (summary_ja, summary_en) and English translations using the following tone/audience mode: {audience_mode}.
- If a section is missing, use null or an empty list.
"""

class GeminiOCRProvider(OCRProvider):
    @property
    def name(self) -> str:
        return "gemini"

    async def extract(self, file_path: str, content_type: str, preferences: UserPreferences | None = None) -> OCRResult:
        if not settings.gemini_api_key:
            raise OCRProviderError("GEMINI_API_KEY not configured.")

        try:
            with open(file_path, "rb") as fh:
                data = fh.read()
        except OSError as exc:
            raise OCRProviderError(f"Could not read upload: {exc}") from exc

        encoded = base64.b64encode(data).decode("ascii")

        # Formulate prompt with audience mode context
        audience_mode = preferences.audience_mode if preferences else "standard"
        tone_instruction = {
            "standard": "Standard medical translation, clear and accurate.",
            "simple": "Simple, everyday language. Avoid complex medical jargon.",
            "caregiver": "Focus heavily on safe administration, dosage limits, and clear warnings for someone giving the medicine to another person."
        }.get(audience_mode, "Standard medical translation, clear and accurate.")
        
        prompt = _SINGLE_PASS_PROMPT.replace("{audience_mode}", tone_instruction)

        body = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": content_type or "image/jpeg",
                                "data": encoded,
                            }
                        },
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 8192,
                "responseMimeType": "application/json",
            },
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(
                    GEMINI_ENDPOINT,
                    params={"key": settings.gemini_api_key},
                    json=body,
                )
        except httpx.HTTPError as exc:
            logger.warning("gemini_request_failed", error=str(exc))
            raise OCRProviderError(f"Gemini API request failed: {exc}")

        if resp.status_code != 200:
            logger.error("gemini_error_response", status=resp.status_code, body=resp.text)
            raise OCRProviderError(f"Gemini analysis returned {resp.status_code}.")

        try:
            payload = resp.json()
            raw_response = (
                payload.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "{}")
            )
            
            # Clean response: Gemini sometimes wraps JSON in markdown blocks or adds extra text
            cleaned = raw_response.strip()
            
            # 1. Try to strip markdown code blocks
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            
            # 2. Extract only the JSON object if there's trailing junk (handles "Extra data" error)
            first_brace = cleaned.find("{")
            last_brace = cleaned.rfind("}")
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                cleaned = cleaned[first_brace:last_brace + 1]
            
            parsed = json.loads(cleaned)
        except (json.JSONDecodeError, IndexError, KeyError) as exc:
            logger.error("gemini_parse_error", error=str(exc), response_head=resp.text[:1000])
            raise OCRProviderError("Could not parse Gemini analysis response.") from exc

        raw_text = parsed.get("raw_text") or ""
        confidence = 0.9 if len(raw_text) > 30 else 0.4
        
        def _parse_section_obj(data: dict) -> ParsedSections:
            return ParsedSections(
                intended_use=data.get("intended_use"),
                dosage=data.get("dosage"),
                warnings=data.get("warnings") or [],
                ingredients=data.get("ingredients") or [],
                storage=data.get("storage"),
                age_notes=data.get("age_notes"),
            )

        parsed_ja = parsed.get("sections_ja")
        parsed_en = parsed.get("sections_en")
        sections_ja = _parse_section_obj(parsed_ja) if parsed_ja else None
        sections_en = _parse_section_obj(parsed_en) if parsed_en else None

        return OCRResult(
            raw_text=raw_text,
            blocks=[line for line in raw_text.splitlines() if line.strip()],
            confidence=confidence,
            provider=self.name,
            product_name=parsed.get("product_name"),
            product_name_en=parsed.get("product_name_en"),

            parsed_sections=sections_ja, # Default to JA
            parsed_sections_ja=sections_ja,
            parsed_sections_en=sections_en,
            summary_ja=parsed.get("summary_ja"),
            summary_en=parsed.get("summary_en"),
        )
