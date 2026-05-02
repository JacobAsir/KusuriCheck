"""Unit tests for the structured parser."""
from __future__ import annotations

from app.services.parser import parse


SAMPLE = """\
パブロンS錠

【効能・効果】
かぜの諸症状の緩和

【用法・用量】
成人1回3錠 1日3回 食後

【使用上の注意】
次の人は服用しないこと
本剤の成分でアレルギーを起こした人

【成分・分量】
アセトアミノフェン 900mg

【保管及び取扱い上の注意】
直射日光を避け涼しい所に保管
"""


def test_extracts_intended_use() -> None:
    result = parse(SAMPLE)
    assert result.sections.intended_use is not None
    assert "かぜ" in result.sections.intended_use


def test_extracts_dosage() -> None:
    result = parse(SAMPLE)
    assert result.sections.dosage is not None
    assert "1日3回" in result.sections.dosage


def test_extracts_warnings() -> None:
    result = parse(SAMPLE)
    assert any("使用しない" in w or "アレルギー" in w for w in result.sections.warnings)


def test_extracts_storage() -> None:
    result = parse(SAMPLE)
    assert result.sections.storage is not None
    assert "保管" in result.sections.storage or "直射日光" in result.sections.storage


def test_product_name_detection() -> None:
    result = parse(SAMPLE)
    assert result.product_name == "パブロンS錠"


def test_evidence_lines() -> None:
    result = parse(SAMPLE)
    assert len(result.evidence) > 0
    categories = {e.category for e in result.evidence}
    assert categories  # at least one category present


def test_empty_text() -> None:
    result = parse("")
    assert result.product_name is None
    assert result.sections.dosage is None
    assert result.evidence == []
