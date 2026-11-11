import httpx2

FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_{window}.geojson"


class UsgsError(Exception):
    """USGS no respondió o devolvió algo que no es un feed GeoJSON."""


class UsgsClient:
    def __init__(self, http: httpx2.Client | None = None):
        self._http = http or httpx2.Client(timeout=httpx2.Timeout(10.0))

    def fetch(self, window: str) -> dict:
        try:
            response = self._http.get(FEED_URL.format(window=window))
            response.raise_for_status()
            data = response.json()
        except httpx2.HTTPError as exc:
            raise UsgsError(f"Error al consultar USGS: {exc}") from exc
        except ValueError as exc:
            raise UsgsError("USGS devolvió una respuesta que no es JSON") from exc
        if not isinstance(data, dict) or not isinstance(data.get("features"), list):
            raise UsgsError("USGS devolvió un JSON que no es un feed GeoJSON")
        return data
