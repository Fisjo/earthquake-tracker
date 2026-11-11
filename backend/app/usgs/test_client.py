import httpx2
import pytest

from app.usgs.client import FEED_URL, UsgsClient, UsgsError


def _cliente(handler) -> UsgsClient:
    http = httpx2.Client(transport=httpx2.MockTransport(handler))
    return UsgsClient(http)


def test_descarga_el_feed_de_la_ventana_pedida():
    vistas = []

    def handler(request):
        vistas.append(str(request.url))
        return httpx2.Response(200, json={"type": "FeatureCollection", "features": []})

    datos = _cliente(handler).fetch("week")
    assert datos == {"type": "FeatureCollection", "features": []}
    assert vistas == [FEED_URL.format(window="week")]
    assert vistas[0].endswith("/all_week.geojson")


def test_estado_http_de_error_lanza_usgs_error():
    with pytest.raises(UsgsError):
        _cliente(lambda request: httpx2.Response(500)).fetch("day")


def test_timeout_lanza_usgs_error():
    def handler(request):
        raise httpx2.TimeoutException("lento", request=request)

    with pytest.raises(UsgsError):
        _cliente(handler).fetch("day")


def test_error_de_red_lanza_usgs_error():
    def handler(request):
        raise httpx2.TransportError("sin red", request=request)

    with pytest.raises(UsgsError):
        _cliente(handler).fetch("hour")


def test_json_roto_lanza_usgs_error():
    with pytest.raises(UsgsError):
        _cliente(lambda request: httpx2.Response(200, content=b"<html>")).fetch("day")


def test_json_sin_features_lanza_usgs_error():
    with pytest.raises(UsgsError):
        _cliente(lambda request: httpx2.Response(200, json={"hola": 1})).fetch("day")
