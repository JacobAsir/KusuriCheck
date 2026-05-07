"""Domain-specific exception classes."""
from __future__ import annotations


class KusuriCheckError(Exception):
    """Base exception for application errors."""

    status_code: int = 500
    error_code: str = "internal_error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class InvalidFileError(KusuriCheckError):
    status_code = 400
    error_code = "invalid_file"


class FileTooLargeError(KusuriCheckError):
    status_code = 413
    error_code = "file_too_large"


class UnreadableImageError(KusuriCheckError):
    status_code = 422
    error_code = "unreadable_image"


class OCRProviderError(KusuriCheckError):
    status_code = 502
    error_code = "ocr_provider_failure"





class UnknownDemoError(KusuriCheckError):
    status_code = 400
    error_code = "unknown_demo"
