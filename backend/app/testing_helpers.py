"""Datos y dobles de prueba compartidos. Solo se importan desde las pruebas."""

from datetime import UTC, datetime

from app.usgs.client import UsgsError

NOW = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)


def ms(moment: datetime) -> int:
    return int(moment.timestamp() * 1000)


def make_feature(
    usgs_id="us1",
    mag=4.5,
    place="10 km N of Ficticia",
    time=None,
    depth=10.0,
    lon=-70.25,
    lat=12.5,
    sig=300,
    alert=None,
    tsunami=0,
    title=None,
):
    coordinates = [lon, lat] if depth is None else [lon, lat, depth]
    return {
        "type": "Feature",
        "id": usgs_id,
        "properties": {
            "mag": mag,
            "place": place,
            "time": ms(NOW) if time is None else ms(time),
            "title": title if title is not None else f"M {mag} - {place}",
            "alert": alert,
            "tsunami": tsunami,
            "sig": sig,
        },
        "geometry": {"type": "Point", "coordinates": coordinates},
    }


def make_geojson(*features):
    return {"type": "FeatureCollection", "features": list(features)}


class FakeUsgsClient:
    """Sustituye al cliente real: devuelve un GeoJSON fijo o lanza UsgsError."""

    def __init__(self, geojson=None, error: str | None = None):
        self.geojson = geojson if geojson is not None else make_geojson()
        self.error = error
        self.calls: list[str] = []

    def fetch(self, window: str) -> dict:
        self.calls.append(window)
        if self.error:
            raise UsgsError(self.error)
        return self.geojson


class FakeClock:
    def __init__(self, now: float = 1000.0):
        self.now = now

    def __call__(self) -> float:
        return self.now
