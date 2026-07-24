import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import (
    activities,
    calendar,
    carematch,
    check_ins,
    friends,
    recommendation_context,
    recommendations,
    users,
)

logger = logging.getLogger(__name__)

app = FastAPI(title="CareShift API")

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Normalizes every error response to {"error": CODE, "message": "..."}.
    AppError already sets detail to that shape; anything still using plain
    HTTPException(detail="...") gets a generic code derived from the status."""
    if isinstance(exc.detail, dict) and "error" in exc.detail and "message" in exc.detail:
        body = exc.detail
    else:
        fallback_codes = {400: "BAD_REQUEST", 404: "NOT_FOUND", 422: "UNPROCESSABLE"}
        body = {
            "error": fallback_codes.get(exc.status_code, "ERROR"),
            "message": str(exc.detail),
        }
    return JSONResponse(status_code=exc.status_code, content=body)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Last-resort catch-all (e.g. a Supabase request failure) so the client
    always gets a consistent JSON error shape instead of a raw 500 traceback."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_ERROR", "message": "Something went wrong. Please try again."},
    )

app.include_router(users.router)
app.include_router(check_ins.router)
app.include_router(calendar.router)
app.include_router(recommendation_context.router)
app.include_router(recommendations.router)
app.include_router(activities.router)
app.include_router(friends.router)
app.include_router(carematch.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
