from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_cache, get_now, get_usgs_client
from app.db import get_session
from app.main import app
from app.testing_helpers import (
    NOW,
    FakeClock,
    FakeUsgsClient,
    make_feature,
    make_geojson,
)
from app.usgs.cache import FreshnessCache


def _minutos(n):
    return NOW - timedelta(minutes=n)


@pytest.fixture
def usgs():
    return FakeUsgsClient(
        make_geojson(
            make_feature(usgs_id="reciente", mag=3.0, depth=5.0, sig=100, time=_minutos(1)),
            make_feature(usgs_id="fuerte", mag=6.0, depth=20.0, sig=700, time=_minutos(30)),
            make_feature(usgs_id="profundo", mag=4.0, depth=600.0, sig=300, time=_minutos(120)),
        )
    )


@pytest.fixture
def client(migrated_session, usgs):
    cache = FreshnessCache(ttl_seconds=90, clock=FakeClock())
    app.dependency_overrides[get_session] = lambda: migrated_session
    app.dependency_overrides[get_usgs_client] = lambda: usgs
    app.dependency_overrides[get_cache] = lambda: cache
    app.dependency_overrides[get_now] = lambda: NOW
    yield TestClient(app)
    app.dependency_overrides.clear()


def _ids(response):
    return [e["usgs_id"] for e in response.json()["earthquakes"]]


def test_devuelve_los_sismos_de_la_ventana_con_sus_campos(client):
    response = client.get("/api/earthquakes?window=day")
    assert response.status_code == 200
    cuerpo = response.json()
    assert cuerpo["stale"] is False
    assert cuerpo["warning"] is None
    sismo = next(e for e in cuerpo["earthquakes"] if e["usgs_id"] == "fuerte")
    assert sismo["magnitude"] == 6.0
    assert sismo["significance"] == 700
    assert "raw_data" not in sismo


def test_valores_por_defecto_son_dia_y_mas_recientes(client):
    assert _ids(client.get("/api/earthquakes")) == ["reciente", "fuerte", "profundo"]


def test_la_ventana_hora_filtra(client):
    assert _ids(client.get("/api/earthquakes?window=hour")) == ["reciente", "fuerte"]


@pytest.mark.parametrize(
    ("sort", "esperado"),
    [
        ("recent", ["reciente", "fuerte", "profundo"]),
        ("magnitude", ["fuerte", "profundo", "reciente"]),
        ("depth", ["profundo", "fuerte", "reciente"]),
        ("significance", ["fuerte", "profundo", "reciente"]),
    ],
)
def test_ordenes(client, sort, esperado):
    assert _ids(client.get(f"/api/earthquakes?window=day&sort={sort}")) == esperado


def test_limit_recorta_el_resultado(client):
    assert _ids(client.get("/api/earthquakes?limit=2")) == ["reciente", "fuerte"]


@pytest.mark.parametrize(
    "query",
    ["window=mes", "sort=color", "limit=0", "limit=2001", "limit=abc"],
)
def test_parametros_invalidos_dan_422(client, query):
    assert client.get(f"/api/earthquakes?{query}").status_code == 422


def test_usgs_caido_con_historico_sirve_lo_guardado_y_avisa(client, usgs):
    client.get("/api/earthquakes?window=day")
    usgs.error = "USGS no responde"
    app.dependency_overrides[get_cache] = lambda: FreshnessCache(ttl_seconds=90, clock=FakeClock())
    response = client.get("/api/earthquakes?window=day")
    assert response.status_code == 200
    cuerpo = response.json()
    assert cuerpo["stale"] is True
    assert cuerpo["warning"]
    assert len(cuerpo["earthquakes"]) == 3


def test_usgs_caido_sin_historico_devuelve_lista_vacia_y_aviso(client, usgs):
    usgs.error = "USGS no responde"
    response = client.get("/api/earthquakes?window=day")
    assert response.status_code == 200
    assert response.json()["earthquakes"] == []
    assert response.json()["stale"] is True
    assert response.json()["warning"]
