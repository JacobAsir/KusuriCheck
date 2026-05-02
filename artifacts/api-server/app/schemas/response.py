"""Pydantic response schemas."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ContentType = Literal[
    "otc", "supplement", "instruction_sheet", "package_insert_fragment", "unclear"
]
EvidenceCategory = Literal[
    "use", "dosage", "warning", "age_restriction", "ingredient", "storage", "unknown"
]
ProcessingMode = Literal["mock", "gemini", "fallback"]


class HealthStatus(BaseModel):
    status: str
    version: str
    processing_mode: ProcessingMode
    timestamp: str


class DemoSample(BaseModel):
    id: str
    label: str
    label_en: str
    description: str
    content_type: ContentType


class EvidenceLine(BaseModel):
    japanese_text: str
    normalized_meaning: str
    category: EvidenceCategory


class ConsultFlag(BaseModel):
    type: Literal["pharmacist", "doctor"]
    reason: str


class ParsedSections(BaseModel):
    intended_use: str | None = None
    dosage: str | None = None
    warnings: list[str] = Field(default_factory=list)
    ingredients: list[str] = Field(default_factory=list)
    storage: str | None = None
    age_notes: str | None = None


class AnalyzeResponse(BaseModel):
    request_id: str
    content_type: ContentType
    product_name: str | None = None
    confidence_score: float
    sections: ParsedSections
    consult_flags: list[ConsultFlag] = Field(default_factory=list)
    evidence: list[EvidenceLine] = Field(default_factory=list)
    summary_ja: str
    summary_en: str
    raw_ocr_text: str
    warnings: list[str] = Field(default_factory=list)
    escalation_level: int = 0
    processing_mode: ProcessingMode


class ErrorResponse(BaseModel):
    error: str
    message: str
    request_id: str | None = None
