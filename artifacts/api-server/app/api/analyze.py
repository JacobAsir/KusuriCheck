"""File-upload analyze endpoint."""
from __future__ import annotations

import json

from fastapi import APIRouter, File, Form, Request, UploadFile

from app.core.errors import InvalidFileError
from app.schemas.request import UserPreferences
from app.schemas.response import AnalyzeResponse
from app.services.pipeline import analyze_file
from app.utils.file_handler import temp_upload_path, validate_upload

router = APIRouter(tags=["analyze"])


def _parse_preferences(raw: str | None) -> UserPreferences:
    if not raw:
        return UserPreferences()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise InvalidFileError(f"preferences must be valid JSON: {exc}")
    try:
        return UserPreferences.model_validate(data)
    except Exception as exc:
        raise InvalidFileError(f"preferences failed validation: {exc}")


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: Request,
    file: UploadFile = File(...),
    preferences: str | None = Form(None),
) -> AnalyzeResponse:
    request_id = request.state.request_id
    prefs = _parse_preferences(preferences)

    contents = await file.read()
    size = len(contents)
    validate_upload(file, size)

    with temp_upload_path(file.filename or "upload.bin") as tmp_path:
        with open(tmp_path, "wb") as fh:
            fh.write(contents)
        return await analyze_file(
            file_path=tmp_path,
            content_type=file.content_type or "image/jpeg",
            preferences=prefs,
            request_id=request_id,
        )
