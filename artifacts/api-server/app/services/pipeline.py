"""End-to-end analysis pipeline orchestration."""
from __future__ import annotations

from datetime import datetime, timezone

from app.core.config import settings
from app.core.errors import OCRProviderError
from app.core.logging import logger
from app.schemas.request import UserPreferences
from app.schemas.response import AnalyzeResponse, ParsedSections
from app.services.classifier import classify
from app.services.ocr.base import OCRResult
from app.services.ocr.factory import get_ocr_provider
from app.services.parser import parse
from app.services.rule_engine import evaluate


async def analyze_file(
    file_path: str,
    content_type: str,
    preferences: UserPreferences,
    request_id: str,
) -> AnalyzeResponse:
    ocr_provider = get_ocr_provider()

    ocr_result = await ocr_provider.extract(file_path, content_type, preferences)

    return await _build_response(
        ocr_result=ocr_result,
        preferences=preferences,
        request_id=request_id,
        forced_mode=None,
    )




async def _build_response(
    *,
    ocr_result: OCRResult,
    preferences: UserPreferences,
    request_id: str,
    forced_mode: str | None,
) -> AnalyzeResponse:
    # Deterministic classification based on Gemini's raw text
    classification = classify(ocr_result.raw_text)
    
    parse_result = parse(ocr_result.raw_text)

    # Use Gemini's structured parsing if available
    if ocr_result.parsed_sections_ja and ocr_result.parsed_sections_en:
        sections_ja = ocr_result.parsed_sections_ja
        sections_en = ocr_result.parsed_sections_en
        product_name = ocr_result.product_name
        product_name_en = ocr_result.product_name_en
    else:
        # Fallback to legacy parser if Gemini didn't provide structured data
        sections_ja = parse_result.sections
        sections_en = parse_result.sections # No EN fallback for legacy
        product_name = parse_result.product_name
        product_name_en = None

    final_confidence = round(
        (ocr_result.confidence * 0.5 + classification.confidence * 0.5), 3
    )

    # Deterministic safety rule engine - applies to Gemini's output (JA version is safest)
    rule_result = evaluate(
        raw_text=ocr_result.raw_text,
        sections=sections_ja,
        content_type=classification.content_type,
        confidence=final_confidence,
        preferences=preferences,
    )

    # Handle summary suppression for high escalation
    summary_ja = ocr_result.summary_ja or "解析できませんでした。"
    summary_en = ocr_result.summary_en or "Could not analyze document."
    
    response_sections_ja = sections_ja
    response_sections_en = sections_en
    response_evidence = parse_result.evidence 
    
    if rule_result.sections_suppressed:
        suppressed = ParsedSections(
            warnings=sections_ja.warnings,
            ingredients=[],
        )
        response_sections_ja = suppressed
        response_sections_en = suppressed # English version also suppressed
        summary_ja = "【安全のため詳細を非表示にしました】医師または薬剤師にご相談ください。"
        summary_en = "[Details hidden for safety] Please consult a doctor or pharmacist."

    logger.info(
        "analysis_complete",
        request_id=request_id,
        content_type=classification.content_type,
        confidence=final_confidence,
        escalation=rule_result.escalation_level,
        fired_rules=rule_result.fired_rules,
        ocr_provider=ocr_result.provider,
    )

    return AnalyzeResponse(
        request_id=request_id,
        content_type=classification.content_type,  # type: ignore[arg-type]
        product_name=product_name,
        product_name_en=product_name_en,
        confidence_score=final_confidence,
        sections=response_sections_ja, # Legacy field
        sections_ja=response_sections_ja,
        sections_en=response_sections_en,
        consult_flags=rule_result.consult_flags,
        evidence=response_evidence,
        summary_ja=summary_ja,
        summary_en=summary_en,
        raw_ocr_text=ocr_result.raw_text,
        warnings=rule_result.warnings,
        escalation_level=rule_result.escalation_level,
        processing_mode=ocr_result.provider,  # type: ignore[arg-type]
    )


def healthcheck_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()
