import time
from collections.abc import Callable


class FreshnessCache:
    """Recuerda cuándo se consultó USGS por última vez para cada ventana.

    No guarda datos (viven en PostgreSQL), solo evita volver a llamar a USGS
    mientras la última consulta con éxito siga dentro del TTL.
    """

    def __init__(self, ttl_seconds: float = 90, clock: Callable[[], float] = time.monotonic):
        self._ttl = ttl_seconds
        self._clock = clock
        self._last_success: dict[str, float] = {}

    def is_fresh(self, window: str) -> bool:
        last = self._last_success.get(window)
        return last is not None and self._clock() - last < self._ttl

    def mark(self, window: str) -> None:
        self._last_success[window] = self._clock()
