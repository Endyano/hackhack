from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import activities, calendar, check_ins, recommendation_context, recommendations, users

app = FastAPI(title="CareShift API")

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(check_ins.router)
app.include_router(calendar.router)
app.include_router(recommendation_context.router)
app.include_router(recommendations.router)
app.include_router(activities.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
