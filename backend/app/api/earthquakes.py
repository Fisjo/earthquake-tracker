from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.api.deps import get_cache, get_now, get_usgs_client
from app.db import get_session
from app.repositories.earthquakes import list_earthquakes
from app.services.ingest import refresh_window
from app.usgs.cache import FreshnessCache
from app.usgs.client import UsgsClient
from app.windows import SortKey, Window

router = APIRouter()


class EarthquakeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    usgs_id: str
    title: str
    place: str | None
    magnitude: float | None
    depth: float | None
    latitude: float
    longitude: float
    occurred_at: datetime
    alert_level: str | None
    tsunami: bool
    significance: int | None


class EarthquakesResponse(BaseModel):
    earthquakes: list[EarthquakeOut]
    stale: bool
    warning: str | None


@router.get("/earthquakes", response_model=EarthquakesResponse)
def get_earthquakes(
    window: Window = "day",
    sort: SortKey = "recent",
    limit: int = Query(500, ge=1, le=2000),
    session: Session = Depends(get_session),
    client: UsgsClient = Depends(get_usgs_client),
    cache: FreshnessCache = Depends(get_cache),
    now: datetime = Depends(get_now),
) -> EarthquakesResponse:
    ingest = refresh_window(session, window, client, cache)
    sismos = list_earthquakes(session, window, sort, limit, now)
    return EarthquakesResponse(
        earthquakes=[EarthquakeOut.model_validate(s) for s in sismos],
        stale=ingest.stale,
        warning=ingest.warning,
    )
