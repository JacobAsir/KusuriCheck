"""OCR provider interface."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class OCRResult:
    raw_text: str
    blocks: list[str] = field(default_factory=list)
    confidence: float = 0.0
    provider: str = "unknown"


class OCRProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def extract(self, file_path: str, content_type: str) -> OCRResult:
        """Extract Japanese text from the given file path."""
