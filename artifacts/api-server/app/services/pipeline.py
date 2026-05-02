"""End-to-end analysis pipeline orchestration."""
from __future__ import annotations

from datetime import datetime, timezone

from app.core.config import settings
from app.core.errors import ExplainerProviderError, OCRProviderError
from app.core.logging import logger
from app.schemas.request import UserPreferences
from app.schemas.response import AnalyzeResponse, ParsedSections
from app.services.classifier import classify
from app.services.explainer.base import ExplainerInput
from app.services.explainer.factory import (
    deterministic_explainer,
    fallback_explainer,
    get_explainer,
)
from app.services.ocr.base import OCRResult
from app.services.ocr.factory import get_ocr_provider, mock_ocr
from app.services.parser import parse
from app.services.rule_engine import evaluate


async def analyze_file(
    file_path: str,
    content_type: str,
    preferences: UserPreferences,
    request_id: str,
) -> AnalyzeResponse:
    ocr_provider = get_ocr_provider()

    try:
        ocr_result = await ocr_provider.extract(file_path, content_type)
    except OCRProviderError as exc:
        logger.warning("ocr_failed_falling_back", error=str(exc), request_id=request_id)
        # Fall back to mock OCR so the user always gets a structured response
        ocr_result = await mock_ocr.extract(file_path, content_type)
        ocr_result = OCRResult(
            raw_text=ocr_result.raw_text,
            blocks=ocr_result.blocks,
            confidence=min(ocr_result.confidence, 0.35),
            provider="fallback",
        )

    return await _build_response(
        ocr_result=ocr_result,
        preferences=preferences,
        request_id=request_id,
        forced_mode=None,
    )


async def analyze_demo(
    demo_id: str, preferences: UserPreferences, request_id: str
) -> AnalyzeResponse:
    text = mock_ocr.get_fixture(demo_id)
    ocr_result = OCRResult(
        raw_text=text,
        blocks=[ln for ln in text.splitlines() if ln.strip()],
        confidence=0.95,
        provider="mock",
    )
    return await _build_response(
        ocr_result=ocr_result,
        preferences=preferences,
        request_id=request_id,
        forced_mode="mock",
    )


async def _build_response(
    *,
    ocr_result: OCRResult,
    preferences: UserPreferences,
    request_id: str,
    forced_mode: str | None,
) -> AnalyzeResponse:
    classification = classify(ocr_result.raw_text)
    parse_result = parse(ocr_result.raw_text)
    final_confidence = round(
        (ocr_result.confidence * 0.5 + classification.confidence * 0.5), 3
    )

    rule_result = evaluate(
        raw_text=ocr_result.raw_text,
        sections=parse_result.sections,
        content_type=classification.content_type,
        confidence=final_confidence,
        preferences=preferences,
    )

    # Hard suppression at escalation 3: redact structured sections in the
    # response itself (not only in the explainer input). Warnings/ingredients
    # remain because they are derived from the rule engine and can help the
    # user understand why we suppressed the summary.
    sections_for_explainer = parse_result.sections
    response_sections = parse_result.sections
    response_evidence = parse_result.evidence
    if rule_result.sections_suppressed:
        sections_for_explainer = ParsedSections(
            warnings=parse_result.sections.warnings,
            ingredients=[],
        )
        response_sections = ParsedSections(
            intended_use=None,
            dosage=None,
            warnings=parse_result.sections.warnings,
            ingredients=[],
            storage=None,
            age_notes=None,
        )
        # Keep only warning/age-restriction evidence so the consult-call is
        # contextualized but no usage instructions leak through.
        response_evidence = [
            line
            for line in parse_result.evidence
            if line.category in {"warning", "age_restriction"}
        ]

    explainer_input = ExplainerInput(
        content_type=classification.content_type,
        product_name=parse_result.product_name,
        sections=sections_for_explainer,
        evidence=parse_result.evidence,
        raw_text=ocr_result.raw_text,
        preferences=preferences,
        escalation_level=rule_result.escalation_level,
    )

    # Hard gate: at escalation >= 3 the deterministic template is the ONLY
    # legal explainer. The LLM (Groq) is never given a chance to inject
    # claims that the rule engine has already decided are unsafe to surface.
    if rule_result.escalation_level >= 3:
        explainer = deterministic_explainer
        used_mode = "fallback"
    else:
        explainer = get_explainer()
        used_mode = forced_mode or settings.explainer_mode

    try:
        explained = await explainer.explain(explainer_input)
    except ExplainerProviderError as exc:
        logger.warning(
            "explainer_failed_falling_back",
            error=str(exc),
            request_id=request_id,
        )
        explained = await fallback_explainer.explain(explainer_input)
        used_mode = "fallback"

    if forced_mode is not None:
        processing_mode = forced_mode  # type: ignore[assignment]
    elif used_mode == "groq":
        processing_mode = settings.ocr_mode  # follow OCR mode for top-level field
    else:
        processing_mode = "fallback" if used_mode == "fallback" else settings.ocr_mode

    logger.info(
        "analysis_complete",
        request_id=request_id,
        content_type=classification.content_type,
        confidence=final_confidence,
        escalation=rule_result.escalation_level,
        fired_rules=rule_result.fired_rules,
        ocr_provider=ocr_result.provider,
        explainer=used_mode,
    )

    return AnalyzeResponse(
        request_id=request_id,
        content_type=classification.content_type,  # type: ignore[arg-type]
        product_name=parse_result.product_name,
        confidence_score=final_confidence,
        sections=response_sections,
        consult_flags=rule_result.consult_flags,
        evidence=response_evidence,
        summary_ja=explained.summary_ja,
        summary_en=explained.summary_en,
        raw_ocr_text=ocr_result.raw_text,
        warnings=rule_result.warnings,
        escalation_level=rule_result.escalation_level,
        processing_mode=processing_mode,  # type: ignore[arg-type]
    )


def healthcheck_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()
