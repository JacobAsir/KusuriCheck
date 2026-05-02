"""Explainer provider interface - converts structured findings into bilingual summaries."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.schemas.request import UserPreferences
from app.schemas.response import EvidenceLine, ParsedSections


@dataclass
class ExplainerInput:
    content_type: str
    product_name: str | None
    sections: ParsedSections
    evidence: list[EvidenceLine]
    raw_text: str
    preferences: UserPreferences
    escalation_level: int


@dataclass
class ExplainerOutput:
    summary_ja: str
    summary_en: str


class ExplainerProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def explain(self, payload: ExplainerInput) -> ExplainerOutput:
        ...
