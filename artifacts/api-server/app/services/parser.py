"""Structured parser - extracts sections and evidence lines from OCR text."""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.schemas.response import EvidenceLine, ParsedSections
from app.utils.japanese_patterns import (
    DOSAGE_CONTEXT,
    EVIDENCE_MEANINGS,
    SECTION_HEADERS,
)


@dataclass
class ParseResult:
    product_name: str | None
    sections: ParsedSections
    evidence: list[EvidenceLine] = field(default_factory=list)


# Matches headers like 【効能・効果】, ■効能■, ●用法・用量●, [効能]
_HEADER_RE = re.compile(r"[【\[■●◆◇★☆\(]+([^】\]\)■●◆◇★☆]+)[】\]\)■●◆◇★☆]+")


def _detect_product_name(text: str) -> str | None:
    """Heuristically pick a product name from the first non-empty lines."""
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    for line in lines[:5]:
        # Skip obvious section headers
        if line.startswith(("【", "[", "■", "●", "◆")):
            continue
        # Reasonable length, not a sentence
        if 2 <= len(line) <= 40 and "。" not in line:
            return line
    return None


def _categorize_header(header_text: str) -> str | None:
    """Map a header string to one of the section keys.

    Uses longest-match to disambiguate cases like "保管及び取扱い上の注意"
    where the word "注意" (warnings) and "保管" (storage) both appear.
    Storage wins because the more specific keyword is the section header.
    """
    cleaned = header_text.strip()
    best_match: tuple[str, int] | None = None
    for section_key, keywords in SECTION_HEADERS.items():
        for kw in keywords:
            if kw in cleaned:
                if best_match is None or len(kw) > best_match[1]:
                    best_match = (section_key, len(kw))
    return best_match[0] if best_match else None


def _split_into_sections(text: str) -> dict[str, list[str]]:
    """Walk the OCR text and bucket lines into the section they belong to."""
    sections: dict[str, list[str]] = {key: [] for key in SECTION_HEADERS}
    current_key: str | None = None

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            current_key = None
            continue

        header_match = _HEADER_RE.search(line)
        if header_match:
            section_key = _categorize_header(header_match.group(1))
            if section_key:
                current_key = section_key
                # If header line also contains content after the bracket, capture it
                tail = _HEADER_RE.sub("", line).strip()
                if tail:
                    sections[current_key].append(tail)
                continue

        if current_key:
            sections[current_key].append(line)
        else:
            # Try to assign by content keywords - dosage context
            if any(token in line for token in DOSAGE_CONTEXT):
                sections.setdefault("dosage", []).append(line)

    return sections


def _join(lines: list[str]) -> str | None:
    cleaned = [ln for ln in lines if ln]
    if not cleaned:
        return None
    return "\n".join(cleaned).strip()


def _split_warnings(lines: list[str]) -> list[str]:
    """Return a deduplicated list of meaningful warning lines."""
    out: list[str] = []
    seen: set[str] = set()
    for line in lines:
        s = line.strip()
        if not s or s in seen:
            continue
        if len(s) < 4:
            continue
        seen.add(s)
        out.append(s)
    return out[:30]


def _split_ingredients(lines: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for line in lines:
        for chunk in re.split(r"[、,]", line):
            s = chunk.strip()
            if not s or s in seen:
                continue
            if len(s) > 80:
                continue
            seen.add(s)
            out.append(s)
    return out[:30]


def _build_evidence(text: str) -> list[EvidenceLine]:
    """Extract evidence lines mapped to categories with normalized meanings."""
    evidence: list[EvidenceLine] = []
    seen: set[str] = set()

    category_map: dict[str, str] = {
        "intended_use": "use",
        "dosage": "dosage",
        "warnings": "warning",
        "age_restriction": "age_restriction",
        "ingredients": "ingredient",
        "storage": "storage",
    }

    for line in text.splitlines():
        s = line.strip()
        if not s or s in seen or len(s) < 3:
            continue

        for keyword, meaning in EVIDENCE_MEANINGS.items():
            if keyword in s:
                # Pick a category for this evidence
                category: str = "unknown"
                for sec_key, kws in SECTION_HEADERS.items():
                    if any(k in s for k in kws):
                        category = category_map.get(sec_key, "unknown")
                        break
                if category == "unknown":
                    if keyword in ("妊婦", "授乳中", "高齢者", "小児"):
                        category = "age_restriction"
                    elif keyword in ("用法", "用量", "1日", "食後", "食前", "就寝前", "成人"):
                        category = "dosage"
                    elif keyword in ("効能", "効果"):
                        category = "use"
                    elif keyword in ("注意", "副作用"):
                        category = "warning"
                    elif keyword in ("保管",):
                        category = "storage"
                    elif keyword in ("成分",):
                        category = "ingredient"

                evidence.append(
                    EvidenceLine(
                        japanese_text=s[:140],
                        normalized_meaning=meaning,
                        category=category,  # type: ignore[arg-type]
                    )
                )
                seen.add(s)
                break

    return evidence[:20]


def parse(text: str) -> ParseResult:
    """Run structured parsing on the OCR text."""
    if not text:
        return ParseResult(
            product_name=None,
            sections=ParsedSections(),
            evidence=[],
        )

    section_buckets = _split_into_sections(text)

    sections = ParsedSections(
        intended_use=_join(section_buckets.get("intended_use", [])),
        dosage=_join(section_buckets.get("dosage", [])),
        warnings=_split_warnings(section_buckets.get("warnings", [])),
        ingredients=_split_ingredients(section_buckets.get("ingredients", [])),
        storage=_join(section_buckets.get("storage", [])),
        age_notes=_join(section_buckets.get("age_restriction", [])),
    )

    return ParseResult(
        product_name=_detect_product_name(text),
        sections=sections,
        evidence=_build_evidence(text),
    )
