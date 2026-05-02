"""Upload file validation and temporary handling."""
from __future__ import annotations

import os
import tempfile
import uuid
from contextlib import contextmanager
from typing import Iterator

from fastapi import UploadFile

from app.core.config import settings
from app.core.errors import FileTooLargeError, InvalidFileError


def validate_upload(file: UploadFile, size_bytes: int) -> None:
    """Validate the uploaded file meets type and size constraints."""
    if not file.filename:
        raise InvalidFileError("Uploaded file has no filename.")

    content_type = (file.content_type or "").lower()
    if content_type not in settings.allowed_mime_set:
        raise InvalidFileError(
            f"Unsupported file type: {content_type or 'unknown'}. "
            f"Allowed: {', '.join(sorted(settings.allowed_mime_set))}."
        )

    if size_bytes <= 0:
        raise InvalidFileError("Uploaded file is empty.")

    if size_bytes > settings.max_upload_bytes:
        raise FileTooLargeError(
            f"File too large ({size_bytes / 1024 / 1024:.1f} MB). "
            f"Max allowed: {settings.max_upload_mb} MB."
        )


@contextmanager
def temp_upload_path(filename: str) -> Iterator[str]:
    """Create a temp file path that is cleaned up afterwards."""
    suffix = os.path.splitext(filename)[1] or ".bin"
    fd, path = tempfile.mkstemp(prefix="kusuri_", suffix=suffix)
    os.close(fd)
    try:
        yield path
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def new_request_id() -> str:
    return uuid.uuid4().hex[:12]
