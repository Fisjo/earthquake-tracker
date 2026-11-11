from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.repositories.earthquakes import upsert_many
from app.usgs.cache import FreshnessCache
from app.usgs.client import UsgsClient, UsgsError
from app.usgs.parser import parse_feed

STALE_WARNING = (
    "No se pudo contactar con USGS: se muestran los sismos ya guardados, "
    "que pueden no estar al día."
)


@dataclass
class IngestResult:
    stale: bool = False
    warning: str | None = None


def refresh_window(
    session: Session, window: str, client: UsgsClient, cache: FreshnessCache
) -> IngestResult:
    """Trae el feed de la ventana a la base de datos, salvo que esté fresco o USGS falle."""
    if cache.is_fresh(window):
        return IngestResult()
    try:
        geojson = client.fetch(window)
    except UsgsError:
        return IngestResult(stale=True, warning=STALE_WARNING)
    upsert_many(session, parse_feed(geojson).earthquakes)
    session.commit()
    cache.mark(window)
    return IngestResult()
