from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_cache, get_now, get_usgs_client
from app.db import get_session
from app.services.ingest import refresh_window
from app.services.stats import compute_stats
from app.usgs.cache import FreshnessCache
from app.usgs.client import UsgsClient

router = APIRouter()


class RegionOut(BaseModel):
    name: str
    count: int


class StatsResponse(BaseModel):
    total_24h: int
    max_magnitude: float | None
    most_active_region: RegionOut | None
    stale: bool
    warning: str | None


@router.get("/stats", response_model=StatsResponse)
def get_stats(
    session: Session = Depends(get_session),
    client: UsgsClient = Depends(get_usgs_client),
    cache: FreshnessCache = Depends(get_cache),
    now: datetime = Depends(get_now),
) -> StatsResponse:
    ingest = refresh_window(session, "day", client, cache)
    stats = compute_stats(session, now)
    region = stats.most_active_region
    return StatsResponse(
        total_24h=stats.total_24h,
        max_magnitude=stats.max_magnitude,
        most_active_region=RegionOut(name=region.name, count=region.count) if region else None,
        stale=ingest.stale,
        warning=ingest.warning,
    )
