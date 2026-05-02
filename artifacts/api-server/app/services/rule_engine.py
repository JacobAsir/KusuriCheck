"""Deterministic safety rule engine.

Implements rules R01–R10 from the design plan. The LLM never overrides this.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.schemas.request import UserPreferences
from app.schemas.response import ConsultFlag, ParsedSections
from app.utils.japanese_patterns import (
    BOXED_WARNING_PATTERNS,
    CAUTION_PATTERNS,
    DO_NOT_USE_PATTERNS,
    HIGH_RISK_PATTERNS,
)


@dataclass
class RuleResult:
    escalation_level: int = 0
    sections_suppressed: bool = False
    warnings: list[str] = field(default_factory=list)
    consult_flags: list[ConsultFlag] = field(default_factory=list)
    fired_rules: list[str] = field(default_factory=list)

    def add_pharmacist(self, reason: str) -> None:
        if any(f.type == "pharmacist" and f.reason == reason for f in self.consult_flags):
            return
        self.consult_flags.append(ConsultFlag(type="pharmacist", reason=reason))

    def add_doctor(self, reason: str) -> None:
        if any(f.type == "doctor" and f.reason == reason for f in self.consult_flags):
            return
        self.consult_flags.append(ConsultFlag(type="doctor", reason=reason))

    def add_warning(self, msg: str) -> None:
        if msg not in self.warnings:
            self.warnings.append(msg)

    def fire(self, rule_id: str) -> None:
        if rule_id not in self.fired_rules:
            self.fired_rules.append(rule_id)


def evaluate(
    raw_text: str,
    sections: ParsedSections,
    content_type: str,
    confidence: float,
    preferences: UserPreferences,
) -> RuleResult:
    result = RuleResult()
    text = raw_text or ""
    profile = preferences.caution_profile

    # R01: Prescription-only markers
    if "処方箋医薬品" in text or "要処方" in text:
        result.fire("R01")
        result.add_doctor(
            "This appears to be prescription-only content. A doctor's guidance is required."
        )
        result.add_warning(
            "Prescription-only medicine markers were detected — do not self-administer based on this summary."
        )

    # R02: 劇薬 / 毒薬
    if "劇薬" in text or "毒薬" in text:
        result.fire("R02")
        result.add_doctor(
            "Strong-action ('劇薬') or poisonous-class ('毒薬') wording was detected."
        )
        result.add_warning(
            "Strong-action ('劇薬' / '毒薬') wording was found. Confirm with a doctor before use."
        )

    # R03: Pregnancy/breastfeeding caution + matching profile
    pregnancy_hit = any(p in text for p in CAUTION_PATTERNS["pregnant"])
    if pregnancy_hit and any(p in text for p in DO_NOT_USE_PATTERNS):
        result.fire("R03")
        if profile.pregnant_breastfeeding:
            result.add_warning(
                "Important: this product contains a pregnancy/breastfeeding restriction that matches your profile."
            )
            result.add_pharmacist(
                "Pregnancy / breastfeeding restriction detected — confirm with a pharmacist."
            )
        else:
            result.add_warning(
                "This product contains a pregnancy/breastfeeding caution."
            )

    # R04: Child use restrictions + matching profile
    child_hit = any(p in text for p in CAUTION_PATTERNS["child"])
    if child_hit and any(p in text for p in DO_NOT_USE_PATTERNS):
        result.fire("R04")
        if profile.child_use:
            result.add_warning(
                "Important: this product restricts use for children that matches your profile."
            )
            result.add_pharmacist(
                "Pediatric restriction detected — confirm with a pharmacist."
            )

    # R05: Liver / kidney caution + matching profile
    if any(p in text for p in CAUTION_PATTERNS["liver"]) and profile.liver_concern:
        result.fire("R05")
        result.add_warning(
            "Important: liver-function caution found and your profile flags liver concern."
        )
        result.add_pharmacist("Liver-function caution — confirm with a pharmacist.")

    if any(p in text for p in CAUTION_PATTERNS["kidney"]) and profile.kidney_concern:
        result.fire("R05")
        result.add_warning(
            "Important: kidney-function caution found and your profile flags kidney concern."
        )
        result.add_pharmacist("Kidney-function caution — confirm with a pharmacist.")

    # Elderly profile
    if any(p in text for p in CAUTION_PATTERNS["elderly"]) and profile.elderly:
        result.fire("R05")
        result.add_pharmacist(
            "Elderly-use caution detected — confirm dosing with a pharmacist."
        )

    # R06: Low confidence
    if confidence < 0.4:
        result.fire("R06")
        result.add_warning(
            "We could not read this label clearly. Treat the summary as low-confidence."
        )
        result.add_pharmacist(
            "Confidence is low. Please confirm the actual product information with a pharmacist."
        )

    # R07: Dosage missing - never fabricate
    if not sections.dosage:
        result.fire("R07")
        result.add_warning(
            "Dosage information was not found in the label. Do not assume a default dose."
        )

    # R08: Unclear content type
    if content_type == "unclear":
        result.fire("R08")
        result.add_warning(
            "We could not determine what kind of document this is."
        )
        result.add_pharmacist(
            "Document type is unclear — confirm with a pharmacist before relying on this output."
        )

    # R09: 副作用 / 重篤
    if any(p in text for p in HIGH_RISK_PATTERNS):
        result.fire("R09")
        result.add_warning(
            "Serious side-effect language was detected in the label."
        )
        result.add_doctor(
            "Serious side-effect or risk language was detected — consult a doctor."
        )

    # R10: Boxed warning patterns
    if any(p in text for p in BOXED_WARNING_PATTERNS):
        result.fire("R10")
        result.add_doctor(
            "Boxed-warning style content was detected — please consult a doctor."
        )

    # Escalation level computation
    has_doctor = any(f.type == "doctor" for f in result.consult_flags)
    has_pharmacist = any(f.type == "pharmacist" for f in result.consult_flags)

    if "R10" in result.fired_rules:
        result.escalation_level = 3
    elif "R01" in result.fired_rules and "R02" in result.fired_rules:
        result.escalation_level = 3
    elif "R08" in result.fired_rules and "R06" in result.fired_rules:
        result.escalation_level = 3
    elif has_doctor:
        result.escalation_level = 2
    elif has_pharmacist:
        result.escalation_level = 1
    else:
        result.escalation_level = 0

    if result.escalation_level == 3:
        result.sections_suppressed = True

    return result
