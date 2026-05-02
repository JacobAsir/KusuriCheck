"""Health endpoint."""
from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings
from app.schemas.response import HealthStatus
from app.services.pipeline import healthcheck_timestamp

router = APIRouter(tags=["health"])


@router.get("/healthz", response_model=HealthStatus)
async def healthz() -> HealthStatus:
    return HealthStatus(
        status="ok",
        version=settings.version,
        processing_mode=settings.ocr_mode,  # type: ignore[arg-type]
        timestamp=healthcheck_timestamp(),
    )
