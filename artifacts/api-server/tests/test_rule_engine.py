"""Unit tests for the safety rule engine."""
from __future__ import annotations

from app.schemas.request import CautionProfile, UserPreferences
from app.schemas.response import ParsedSections
from app.services.rule_engine import evaluate


def _prefs(**flags: bool) -> UserPreferences:
    return UserPreferences(caution_profile=CautionProfile(**flags))


def test_prescription_only_triggers_doctor_flag() -> None:
    text = "ワーファリン錠 処方箋医薬品 重要な基本的注意"
    result = evaluate(
        text,
        ParsedSections(dosage="some dosage"),
        content_type="package_insert_fragment",
        confidence=0.7,
        preferences=_prefs(),
    )
    assert "R01" in result.fired_rules
    assert any(f.type == "doctor" for f in result.consult_flags)


def test_low_confidence_triggers_pharmacist_and_warning() -> None:
    result = evaluate(
        "ぼやけた画像",
        ParsedSections(dosage="something"),
        content_type="otc",
        confidence=0.1,
        preferences=_prefs(),
    )
    assert "R06" in result.fired_rules
    assert any(f.type == "pharmacist" for f in result.consult_flags)


def test_missing_dosage_triggers_r07() -> None:
    result = evaluate(
        "効能・効果 のどの痛み",
        ParsedSections(dosage=None),
        content_type="otc",
        confidence=0.7,
        preferences=_prefs(),
    )
    assert "R07" in result.fired_rules


def test_unclear_document_triggers_r08() -> None:
    result = evaluate(
        "random non-japanese text",
        ParsedSections(dosage=None),
        content_type="unclear",
        confidence=0.2,
        preferences=_prefs(),
    )
    assert "R08" in result.fired_rules
    assert "R06" in result.fired_rules
    # R08 + R06 → escalation 3
    assert result.escalation_level == 3
    assert result.sections_suppressed is True


def test_boxed_warning_escalates_to_doctor() -> None:
    text = "【警告】 重大な副作用 重要な基本的注意"
    result = evaluate(
        text,
        ParsedSections(dosage="1日1錠"),
        content_type="package_insert_fragment",
        confidence=0.8,
        preferences=_prefs(),
    )
    assert "R10" in result.fired_rules
    assert result.escalation_level == 3


def test_pregnancy_profile_escalates() -> None:
    text = "次の人は使用しないこと 妊婦又は妊娠していると思われる人"
    result = evaluate(
        text,
        ParsedSections(dosage="1日1錠"),
        content_type="otc",
        confidence=0.8,
        preferences=_prefs(pregnant_breastfeeding=True),
    )
    assert "R03" in result.fired_rules
    assert any(f.type == "pharmacist" for f in result.consult_flags)


def test_clean_otc_no_flags() -> None:
    text = "栄養補助食品 ビタミンC 1日1粒"
    result = evaluate(
        text,
        ParsedSections(dosage="1日1粒"),
        content_type="supplement",
        confidence=0.8,
        preferences=_prefs(),
    )
    # Should be escalation 0 - no doctor/pharmacist flags
    assert result.escalation_level == 0
