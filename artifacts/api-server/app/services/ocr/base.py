from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from app.schemas.response import ParsedSections
from app.schemas.request import UserPreferences


@dataclass
class OCRResult:
    raw_text: str
    blocks: list[str] = field(default_factory=list)
    confidence: float = 0.0
    provider: str = "unknown"
    parsed_sections: ParsedSections | None = None
    parsed_sections_ja: ParsedSections | None = None
    parsed_sections_en: ParsedSections | None = None
    product_name: str | None = None
    product_name_en: str | None = None
    summary_ja: str | None = None
    summary_en: str | None = None


class OCRProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def extract(self, file_path: str, content_type: str, preferences: UserPreferences | None = None) -> OCRResult:
        """Extract and analyze Japanese text from the given file path."""
