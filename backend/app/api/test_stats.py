from datetime import timedelta

import pytest

from app.api.deps import get_cache
from app.main import app
from app.testing_helpers import NOW, FakeClock, FakeUsgsClient, make_feature, make_geojson
from app.usgs.cache import FreshnessCache


@pytest.fixture
def usgs():
    return FakeUsgsClient(
        make_geojson(
            make_feature(usgs_id="a", mag=4.0, place="5 km N of Santiago, Chile"),
            make_feature(usgs_id="b", mag=5.5, place="9 km S of Calama, Chile"),
            make_feature(usgs_id="c", mag=3.0, place="Mid-Indian Ridge"),
            make_feature(usgs_id="viejo", mag=7.0, time=NOW - timedelta(days=2)),
        )
    )


def test_devuelve_las_estadisticas_de_24_horas(client):
    response = client.get("/api/stats")
    assert response.status_code == 200
    assert response.json() == {
        "total_24h": 3,
        "max_magnitude": 5.5,
        "most_active_region": {"name": "Chile", "count": 2},
        "stale": False,
        "warning": None,
    }


def test_pide_a_usgs_solo_la_ventana_de_un_dia(client, usgs):
    client.get("/api/stats")
    assert usgs.calls == ["day"]


def test_usgs_caido_sin_historico_da_ceros_y_aviso(client, usgs):
    usgs.error = "USGS no responde"
    cuerpo = client.get("/api/stats").json()
    assert cuerpo["total_24h"] == 0
    assert cuerpo["max_magnitude"] is None
    assert cuerpo["most_active_region"] is None
    assert cuerpo["stale"] is True
    assert cuerpo["warning"]


def test_usgs_caido_con_historico_sirve_lo_guardado(client, usgs):
    client.get("/api/stats")
    usgs.error = "USGS no responde"
    app.dependency_overrides[get_cache] = lambda: FreshnessCache(ttl_seconds=90, clock=FakeClock())
    cuerpo = client.get("/api/stats").json()
    assert cuerpo["stale"] is True
    assert cuerpo["total_24h"] == 3
