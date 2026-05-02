"""Document classifier - deterministic keyword heuristics."""
from __future__ import annotations

from dataclasses import dataclass

from app.utils.japanese_patterns import CLASSIFIER_WEIGHTS


@dataclass
class ClassificationResult:
    content_type: str
    confidence: float


_CLASS_ORDER = ["otc", "supplement", "instruction_sheet", "package_insert_fragment"]


def classify(text: str) -> ClassificationResult:
    """Classify the document type from extracted Japanese text.

    Pure keyword heuristic with weighted scoring. Returns ``unclear`` when no
    class scores meaningfully above zero.
    """
    if not text or len(text) < 20:
        return ClassificationResult("unclear", 0.05)

    scores: dict[str, int] = {cls: 0 for cls in _CLASS_ORDER}
    max_possible: dict[str, int] = {
        cls: sum(weights.values()) for cls, weights in CLASSIFIER_WEIGHTS.items()
    }

    for cls, kw_map in CLASSIFIER_WEIGHTS.items():
        for keyword, weight in kw_map.items():
            if keyword in text:
                scores[cls] += weight

    # Pick the highest scoring class
    best_cls = max(scores, key=scores.get)
    best_score = scores[best_cls]

    # Threshold: at least 4 weight points to be considered identified
    if best_score < 4:
        return ClassificationResult("unclear", 0.2)

    raw_confidence = best_score / max(max_possible[best_cls], 1)

    # Length penalty for very short OCR
    length_penalty = 0.0
    if len(text) < 100:
        length_penalty = 0.15

    confidence = max(0.0, min(1.0, raw_confidence + 0.3 - length_penalty))

    # Check for ties or near-ties
    sorted_scores = sorted(scores.values(), reverse=True)
    if len(sorted_scores) >= 2 and sorted_scores[0] - sorted_scores[1] <= 1:
        # Close call - downgrade confidence
        confidence = min(confidence, 0.5)

    return ClassificationResult(best_cls, round(confidence, 3))
