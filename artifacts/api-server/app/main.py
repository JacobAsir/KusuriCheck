"""FastAPI application entry point."""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api import analyze, demo, health
from app.core.config import settings
from app.core.errors import KusuriCheckError
from app.core.logging import configure_logging, logger
from app.utils.file_handler import new_request_id

configure_logging()

app = FastAPI(
    title="KusuriCheck API",
    description=(
        "Stateless backend for KusuriCheck - a Japan-first utility AI app that "
        "helps users understand Japanese medicine and supplement information. "
        "Not a doctor, pharmacist, diagnosis tool, or treatment engine."
    ),
    version=settings.version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):  # type: ignore[no-untyped-def]
    """Attach a stable request_id to every request and log access lines."""
    request.state.request_id = new_request_id()
    response = await call_next(request)
    if request.url.path.startswith("/api"):
        logger.info(
            "request",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            request_id=request.state.request_id,
        )
    return response


def _request_id_for(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


@app.exception_handler(KusuriCheckError)
async def domain_error_handler(
    request: Request, exc: KusuriCheckError
) -> JSONResponse:
    request_id = _request_id_for(request)
    logger.warning(
        "domain_error",
        path=request.url.path,
        code=exc.error_code,
        message=exc.message,
        request_id=request_id,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "request_id": request_id,
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Normalize all HTTPExceptions to the OpenAPI ErrorResponse shape."""
    request_id = _request_id_for(request)
    detail = exc.detail
    if isinstance(detail, dict):
        error_code = str(detail.get("error", "http_error"))
        message = str(detail.get("message", exc.__class__.__name__))
    else:
        error_code = "http_error"
        message = str(detail) if detail else exc.__class__.__name__
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": error_code,
            "message": message,
            "request_id": request_id,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    request_id = _request_id_for(request)
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": "Request validation failed.",
            "request_id": request_id,
        },
    )


# All endpoints are mounted under /api so the upstream proxy can route correctly.
app.include_router(health.router, prefix="/api")
app.include_router(demo.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": "kusuricheck-api",
        "version": settings.version,
        "docs": "/docs",
    }
