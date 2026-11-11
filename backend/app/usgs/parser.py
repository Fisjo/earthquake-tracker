from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass
class ParseResult:
    earthquakes: list[dict] = field(default_factory=list)
    skipped: int = 0


def _number(value) -> float | None:
    return value if isinstance(value, int | float) and not isinstance(value, bool) else None


def _parse_feature(feature: dict) -> dict | None:
    """Convierte una feature de USGS a las columnas de `earthquakes`; None si es inválida."""
    if not isinstance(feature, dict):
        return None
    usgs_id = feature.get("id")
    props = feature.get("properties") or {}
    coordinates = (feature.get("geometry") or {}).get("coordinates")
    time_ms = _number(props.get("time"))
    if not usgs_id or time_ms is None or not isinstance(coordinates, list):
        return None
    if len(coordinates) < 2 or _number(coordinates[0]) is None or _number(coordinates[1]) is None:
        return None
    place = props.get("place")
    return {
        "usgs_id": str(usgs_id),
        "title": props.get("title") or place or str(usgs_id),
        "place": place,
        "magnitude": _number(props.get("mag")),
        "depth": _number(coordinates[2]) if len(coordinates) > 2 else None,
        "latitude": coordinates[1],
        "longitude": coordinates[0],
        "occurred_at": datetime.fromtimestamp(time_ms / 1000, UTC),
        "alert_level": props.get("alert"),
        "tsunami": bool(props.get("tsunami")),
        "significance": props.get("sig") if isinstance(props.get("sig"), int) else None,
        "raw_data": feature,
    }


def parse_feed(geojson: dict) -> ParseResult:
    """Parsea un feed GeoJSON; omite las features inválidas y deduplica por id (gana la última)."""
    by_id: dict[str, dict] = {}
    skipped = 0
    for feature in geojson.get("features", []):
        parsed = _parse_feature(feature)
        if parsed is None:
            skipped += 1
        else:
            by_id[parsed["usgs_id"]] = parsed
    return ParseResult(earthquakes=list(by_id.values()), skipped=skipped)
