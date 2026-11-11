from fastapi import FastAPI

from app.api.earthquakes import router as earthquakes_router
from app.api.stats import router as stats_router

app = FastAPI(title="Earthquake Tracker")
app.include_router(earthquakes_router, prefix="/api")
app.include_router(stats_router, prefix="/api")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
