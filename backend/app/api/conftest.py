import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_cache, get_now, get_usgs_client
from app.db import get_session
from app.main import app
from app.testing_helpers import NOW, FakeClock
from app.usgs.cache import FreshnessCache


@pytest.fixture
def client(migrated_session, usgs):
    """Cliente de la API con BD de pruebas y USGS simulado; cada archivo define `usgs`."""
    cache = FreshnessCache(ttl_seconds=90, clock=FakeClock())
    app.dependency_overrides[get_session] = lambda: migrated_session
    app.dependency_overrides[get_usgs_client] = lambda: usgs
    app.dependency_overrides[get_cache] = lambda: cache
    app.dependency_overrides[get_now] = lambda: NOW
    yield TestClient(app)
    app.dependency_overrides.clear()
