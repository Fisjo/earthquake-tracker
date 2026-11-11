from app.testing_helpers import FakeClock
from app.usgs.cache import FreshnessCache


def test_sin_consulta_previa_no_esta_fresca():
    assert FreshnessCache(ttl_seconds=90, clock=FakeClock()).is_fresh("day") is False


def test_fresca_dentro_del_ttl_y_caduca_despues():
    reloj = FakeClock(1000.0)
    cache = FreshnessCache(ttl_seconds=90, clock=reloj)
    cache.mark("day")
    reloj.now = 1089.0
    assert cache.is_fresh("day") is True
    reloj.now = 1090.0
    assert cache.is_fresh("day") is False


def test_cada_ventana_es_independiente():
    cache = FreshnessCache(ttl_seconds=90, clock=FakeClock())
    cache.mark("hour")
    assert cache.is_fresh("hour") is True
    assert cache.is_fresh("day") is False
