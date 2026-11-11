from sqlalchemy import func, select

from app.models.earthquake import Earthquake
from app.services.ingest import refresh_window
from app.testing_helpers import FakeClock, FakeUsgsClient, make_feature, make_geojson
from app.usgs.cache import FreshnessCache


def _total(session) -> int:
    return session.scalar(select(func.count()).select_from(Earthquake))


def _montaje(*features, **kwargs):
    reloj = FakeClock()
    cache = FreshnessCache(ttl_seconds=90, clock=reloj)
    return FakeUsgsClient(make_geojson(*features), **kwargs), cache, reloj


def test_guarda_los_sismos_del_feed(migrated_session):
    client, cache, _ = _montaje(make_feature(usgs_id="a"), make_feature(usgs_id="b"))
    resultado = refresh_window(migrated_session, "day", client, cache)
    assert resultado.stale is False
    assert resultado.warning is None
    assert _total(migrated_session) == 2


def test_dentro_del_ttl_no_vuelve_a_llamar_a_usgs(migrated_session):
    client, cache, reloj = _montaje(make_feature())
    refresh_window(migrated_session, "day", client, cache)
    reloj.now += 89
    refresh_window(migrated_session, "day", client, cache)
    assert client.calls == ["day"]


def test_pasado_el_ttl_vuelve_a_llamar_y_no_duplica(migrated_session):
    client, cache, reloj = _montaje(make_feature(usgs_id="a", mag=4.0))
    refresh_window(migrated_session, "day", client, cache)
    client.geojson = make_geojson(make_feature(usgs_id="a", mag=4.3))
    reloj.now += 90
    refresh_window(migrated_session, "day", client, cache)
    assert client.calls == ["day", "day"]
    assert _total(migrated_session) == 1
    assert migrated_session.scalars(select(Earthquake)).one().magnitude == 4.3


def test_cada_ventana_tiene_su_propia_cache(migrated_session):
    client, cache, _ = _montaje(make_feature())
    refresh_window(migrated_session, "day", client, cache)
    refresh_window(migrated_session, "hour", client, cache)
    assert client.calls == ["day", "hour"]


def test_usgs_caido_avisa_y_conserva_lo_guardado(migrated_session):
    client, cache, reloj = _montaje(make_feature(usgs_id="a"))
    refresh_window(migrated_session, "day", client, cache)
    client.error = "USGS no responde"
    reloj.now += 120
    resultado = refresh_window(migrated_session, "day", client, cache)
    assert resultado.stale is True
    assert "USGS" in resultado.warning
    assert _total(migrated_session) == 1


def test_tras_un_fallo_la_siguiente_peticion_reintenta(migrated_session):
    client, cache, _ = _montaje(make_feature(), error="caído")
    refresh_window(migrated_session, "day", client, cache)
    client.error = None
    resultado = refresh_window(migrated_session, "day", client, cache)
    assert client.calls == ["day", "day"]
    assert resultado.stale is False
    assert _total(migrated_session) == 1
