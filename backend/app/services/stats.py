from collections import Counter
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.orm import Session

from app.repositories.earthquakes import count_and_max_since, places_since
from app.stats.regions import extract_region
from app.windows import WINDOW_DURATION


@dataclass
class RegionCount:
    name: str
    count: int


@dataclass
class Stats:
    total_24h: int
    max_magnitude: float | None
    most_active_region: RegionCount | None


def compute_stats(session: Session, now: datetime) -> Stats:
    """Estadísticas de las últimas 24 h calculadas sobre la base de datos."""
    since = now - WINDOW_DURATION["day"]
    total, max_magnitude = count_and_max_since(session, since)
    regions = Counter(r for r in map(extract_region, places_since(session, since)) if r)
    # Más sismos primero; en empate, orden alfabético.
    ranked = sorted(regions.items(), key=lambda item: (-item[1], item[0]))
    top = RegionCount(*ranked[0]) if ranked else None
    return Stats(total_24h=total, max_magnitude=max_magnitude, most_active_region=top)
