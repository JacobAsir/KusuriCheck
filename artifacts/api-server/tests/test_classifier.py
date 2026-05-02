"""Unit tests for the document classifier."""
from __future__ import annotations

from app.services.classifier import classify


def test_otc_cold_medicine() -> None:
    text = """
    パブロンS錠 指定第2類医薬品
    効能・効果 かぜの諸症状の緩和
    用法・用量 1日3回 食後
    使用上の注意 妊婦は服用前に医師、薬剤師又は登録販売者に相談すること
    """
    result = classify(text)
    assert result.content_type == "otc"
    assert result.confidence > 0.3


def test_supplement() -> None:
    text = """
    マルチビタミン 栄養機能食品 サプリメント
    1日の摂取目安量 1粒
    栄養成分表示 ビタミンC 100mg
    """
    result = classify(text)
    assert result.content_type == "supplement"


def test_instruction_sheet() -> None:
    text = """
    薬剤情報提供書
    調剤年月日 2024年5月10日 薬局名 ○○薬局 処方医 △△医師
    服薬指導 毎日決まった時間に
    """
    result = classify(text)
    assert result.content_type == "instruction_sheet"


def test_unclear_short_text() -> None:
    result = classify("hello world")
    assert result.content_type == "unclear"
    assert result.confidence < 0.3
