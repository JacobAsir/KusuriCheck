"""Deterministic template-based explainer (no LLM).

Used when no GROQ_API_KEY is set, when the LLM call fails, or when the rule
engine has suppressed sections.
"""
from __future__ import annotations

from app.services.explainer.base import (
    ExplainerInput,
    ExplainerOutput,
    ExplainerProvider,
)


_CONTENT_LABEL_JA = {
    "otc": "市販薬 (OTC)",
    "supplement": "サプリメント / 栄養補助食品",
    "instruction_sheet": "薬剤情報提供書 / 服薬指導書",
    "package_insert_fragment": "添付文書 / 説明書の一部",
    "unclear": "種類が判別できない文書",
}

_CONTENT_LABEL_EN = {
    "otc": "Over-the-counter medicine (OTC)",
    "supplement": "Supplement / nutritional product",
    "instruction_sheet": "Pharmacy instruction sheet",
    "package_insert_fragment": "Package insert fragment",
    "unclear": "Document type unclear",
}


def _truncate(value: str | None, limit: int = 220) -> str | None:
    if value is None:
        return None
    cleaned = value.strip().replace("\n", " ")
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[: limit - 1].rstrip() + "…"


class TemplateExplainer(ExplainerProvider):
    name = "fallback"

    async def explain(self, payload: ExplainerInput) -> ExplainerOutput:
        if payload.escalation_level >= 3:
            return ExplainerOutput(
                summary_ja=(
                    "この内容は安全に要約することができません。"
                    "薬剤師または医師に直接ご相談ください。"
                ),
                summary_en=(
                    "We cannot safely summarize this content. "
                    "Please consult a pharmacist or doctor directly."
                ),
            )

        ja_lines: list[str] = []
        en_lines: list[str] = []

        ja_lines.append(
            f"この資料は「{_CONTENT_LABEL_JA.get(payload.content_type, '不明')}」"
            "として読み取られました。"
        )
        en_lines.append(
            f"This material was read as: "
            f"{_CONTENT_LABEL_EN.get(payload.content_type, 'unclear')}."
        )

        if payload.product_name:
            ja_lines.append(f"おそらくの製品名: {payload.product_name}。")
            en_lines.append(f"Likely product name: {payload.product_name}.")

        intended = _truncate(payload.sections.intended_use)
        if intended:
            ja_lines.append(f"記載されている用途: {intended}")
            en_lines.append(
                f"Stated use (translated only when found in the label): {intended}"
            )
        else:
            ja_lines.append(
                "用途に関する明確な記載は見つかりませんでした。"
                "勝手に推測しないでください。"
            )
            en_lines.append(
                "No explicit indication was found in the label. "
                "Do not assume a use that isn't written."
            )

        dosage = _truncate(payload.sections.dosage, 280)
        if dosage:
            ja_lines.append(f"記載されている用法・用量: {dosage}")
            en_lines.append(f"Stated dosage (only as written): {dosage}")
        else:
            ja_lines.append(
                "用法・用量の記載は見つかりませんでした。自己判断で服用しないでください。"
            )
            en_lines.append(
                "Dosage information was not found. Do not self-administer based on assumptions."
            )

        if payload.sections.warnings:
            joined = "; ".join(payload.sections.warnings[:3])
            ja_lines.append(f"主な注意: {_truncate(joined, 240)}")
            en_lines.append(
                f"Main cautions (as written in Japanese): {_truncate(joined, 240)}"
            )

        if payload.sections.age_notes:
            ja_lines.append(
                f"年齢・体質に関する記載: {_truncate(payload.sections.age_notes)}"
            )
            en_lines.append(
                f"Age / condition notes: {_truncate(payload.sections.age_notes)}"
            )

        ja_lines.append(
            "本アプリは医療判断を行いません。最終的な使用判断は薬剤師または医師にご確認ください。"
        )
        en_lines.append(
            "This app does not make medical decisions. Confirm final usage with a pharmacist or doctor."
        )

        return ExplainerOutput(
            summary_ja="\n".join(ja_lines),
            summary_en="\n".join(en_lines),
        )
