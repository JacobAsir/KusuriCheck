"""Demo samples endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Request

from app.core.errors import UnknownDemoError
from app.schemas.request import AnalyzeDemoRequest
from app.schemas.response import AnalyzeResponse, DemoSample
from app.services.pipeline import analyze_demo

router = APIRouter(tags=["demo"])


_DEMOS: list[DemoSample] = [
    DemoSample(
        id="otc-cold",
        label="OTC感冒薬 (パブロンS錠)",
        label_en="OTC cold medicine (Pablon S)",
        description="指定第2類医薬品の総合感冒薬の典型例。妊婦・小児・高齢者の注意あり。",
        content_type="otc",
    ),
    DemoSample(
        id="otc-painkiller",
        label="OTC鎮痛薬 (ロキソニンS)",
        label_en="OTC painkiller (Loxonin S)",
        description="第1類医薬品。妊婦使用禁止と肝・腎の注意を含む。",
        content_type="otc",
    ),
    DemoSample(
        id="supplement-vitamin",
        label="マルチビタミン サプリ",
        label_en="Multivitamin supplement",
        description="栄養機能食品ラベル。摂取目安と一般注意のみ。",
        content_type="supplement",
    ),
    DemoSample(
        id="pharmacy-instruction",
        label="薬剤情報提供書",
        label_en="Pharmacy instruction sheet",
        description="調剤後の薬剤情報シート。複数処方薬と服薬指導付き。",
        content_type="instruction_sheet",
    ),
    DemoSample(
        id="high-risk-warning",
        label="高リスク警告例 (ワーファリン)",
        label_en="High-risk warning example (Warfarin)",
        description="処方箋医薬品 + 警告ボックス + 重大な副作用記載のあるサンプル。",
        content_type="package_insert_fragment",
    ),
]


@router.get("/demo-samples", response_model=list[DemoSample])
async def list_demo_samples() -> list[DemoSample]:
    return _DEMOS


@router.post("/analyze-demo", response_model=AnalyzeResponse)
async def analyze_demo_sample(
    req: AnalyzeDemoRequest, request: Request
) -> AnalyzeResponse:
    valid_ids = {d.id for d in _DEMOS}
    if req.demo_id not in valid_ids:
        raise UnknownDemoError(f"Unknown demo id: {req.demo_id}")
    request_id = request.state.request_id
    return await analyze_demo(req.demo_id, req.preferences, request_id)
