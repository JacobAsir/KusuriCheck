"""Structured parser - extracts sections and evidence lines from OCR text."""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.schemas.response import EvidenceLine, ParsedSections
from app.utils.japanese_patterns import (
    COMMON_INGREDIENTS,
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
# Also matches naked headers at start of line followed by common medicine section words
_HEADER_RE = re.compile(r"^[\s]*[【\[■●◆◇★☆\(]*([^】\]\)■●◆◇★☆：:]+)[】\]\)■●◆◇★☆：:]*")


def _detect_product_name(text: str) -> str | None:
    """Heuristically pick a product name from the first non-empty lines."""
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    for line in lines[:8]:  # Check a bit deeper
        # Skip obvious section headers
        if any(kw in line for kw in ["効能", "効果", "用法", "成分", "注意", "保管"]):
            continue
        # Reasonable length, not a sentence
        if 2 <= len(line) <= 50 and "。" not in line:
            # Check if it looks like a brand name (Katakana or specific Kanji)
            return line
    return None


def _categorize_header(header_text: str) -> str | None:
    """Map a header string to one of the section keys.

    Uses longest-match to disambiguate cases like "保管及び取扱い上の注意"
    where the word "注意" (warnings) and "保管" (storage) both appear.
    Storage wins because the more specific keyword is the section header.
    """
    cleaned = header_text.strip()
    if not cleaned:
        return None

    best_match: tuple[str, int] | None = None
    for section_key, keywords in SECTION_HEADERS.items():
        for kw in keywords:
            if kw in cleaned:
                # Prioritize exact matches or longer keyword matches
                match_score = len(kw)
                if cleaned == kw:
                    match_score += 100
                if best_match is None or match_score > best_match[1]:
                    best_match = (section_key, match_score)
    return best_match[0] if best_match else None


def _split_into_sections(text: str) -> dict[str, list[str]]:
    """Walk the OCR text and bucket lines into the section they belong to."""
    sections: dict[str, list[str]] = {key: [] for key in SECTION_HEADERS}
    current_key: str | None = None

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        # Try to match a header
        header_match = _HEADER_RE.match(line)
        if header_match:
            potential_header = header_match.group(1).strip()
            section_key = _categorize_header(potential_header)
            
            # Only switch if the line is short enough to be a header or clearly matches a category
            if section_key and len(line) < 30:
                current_key = section_key
                # If header line also contains content after symbols, capture it
                tail = re.sub(r"^[【\[■●◆◇★☆\(\s]*" + re.escape(potential_header) + r"[】\]\)■●◆◇★☆：:\s]*", "", line).strip()
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
        # Split by common bullet points in warnings
        for chunk in re.split(r"[・、(（\d\)）]", line):
            s = chunk.strip()
            if not s or s in seen or len(s) < 4:
                continue
            seen.add(s)
            out.append(s)
    return out[:30]


def _split_ingredients(lines: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for line in lines:
        # Split by comma, dot, space, or Katakana middle dot
        for chunk in re.split(r"[、,．.\s・]", line):
            s = chunk.strip()
            if not s or s in seen:
                continue
            if len(s) > 80:
                continue
            
            # Heuristic: must contain at least one Katakana or Kanji to be an ingredient
            if not any(ord(c) >= 0x3040 for c in s): # basic CJK check
                continue

            # Check for common units/weights and strip them for cleaner display
            s = re.sub(r"[\d\.]+\s*(mg|g|mL|ml|％|%)", "", s).strip()
            if not s or len(s) < 2:
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
