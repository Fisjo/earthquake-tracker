from datetime import UTC, datetime, timedelta

from app.testing_helpers import NOW, make_feature, make_geojson
from app.usgs.parser import parse_feed


def test_mapea_los_campos_de_una_feature():
    hora = NOW - timedelta(minutes=5)
    geojson = make_geojson(
        make_feature(
            usgs_id="us7000abc",
            mag=5.1,
            place="20 km S of Ficticia",
            time=hora,
            depth=33.4,
            lon=-70.5,
            lat=-12.25,
            sig=400,
            alert="green",
            tsunami=1,
            title="M 5.1 - 20 km S of Ficticia",
        )
    )
    resultado = parse_feed(geojson)
    assert resultado.skipped == 0
    sismo = resultado.earthquakes[0]
    assert sismo["usgs_id"] == "us7000abc"
    assert sismo["title"] == "M 5.1 - 20 km S of Ficticia"
    assert sismo["place"] == "20 km S of Ficticia"
    assert sismo["magnitude"] == 5.1
    assert sismo["depth"] == 33.4
    assert sismo["latitude"] == -12.25
    assert sismo["longitude"] == -70.5
    assert sismo["occurred_at"] == hora
    assert sismo["occurred_at"].tzinfo is not None
    assert sismo["alert_level"] == "green"
    assert sismo["tsunami"] is True
    assert sismo["significance"] == 400
    assert sismo["raw_data"]["id"] == "us7000abc"


def test_la_hora_en_milisegundos_se_convierte_a_utc():
    feature = make_feature()
    feature["properties"]["time"] = 1767268800000  # 2026-01-01 12:00:00 UTC
    sismo = parse_feed(make_geojson(feature)).earthquakes[0]
    assert sismo["occurred_at"] == datetime(2026, 1, 1, 12, 0, tzinfo=UTC)


def test_magnitud_nula_se_conserva_como_none():
    sismo = parse_feed(make_geojson(make_feature(mag=None))).earthquakes[0]
    assert sismo["magnitude"] is None


def test_profundidad_ausente_es_none():
    sismo = parse_feed(make_geojson(make_feature(depth=None))).earthquakes[0]
    assert sismo["depth"] is None


def test_alerta_y_significancia_ausentes_son_none_y_tsunami_falso():
    feature = make_feature()
    del feature["properties"]["alert"]
    del feature["properties"]["sig"]
    del feature["properties"]["tsunami"]
    sismo = parse_feed(make_geojson(feature)).earthquakes[0]
    assert sismo["alert_level"] is None
    assert sismo["significance"] is None
    assert sismo["tsunami"] is False


def test_sin_titulo_usa_el_lugar_y_si_no_el_id():
    feature = make_feature(usgs_id="us1")
    feature["properties"]["title"] = None
    assert parse_feed(make_geojson(feature)).earthquakes[0]["title"] == "10 km N of Ficticia"
    feature["properties"]["place"] = None
    assert parse_feed(make_geojson(feature)).earthquakes[0]["title"] == "us1"


def test_features_invalidas_se_omiten_y_se_cuentan():
    sin_id = make_feature()
    del sin_id["id"]
    sin_coordenadas = make_feature(usgs_id="b")
    sin_coordenadas["geometry"]["coordinates"] = [10.0]
    sin_geometria = make_feature(usgs_id="c")
    sin_geometria["geometry"] = None
    sin_hora = make_feature(usgs_id="d")
    sin_hora["properties"]["time"] = None
    valida = make_feature(usgs_id="ok")
    resultado = parse_feed(make_geojson(sin_id, sin_coordenadas, sin_geometria, sin_hora, valida))
    assert [s["usgs_id"] for s in resultado.earthquakes] == ["ok"]
    assert resultado.skipped == 4


def test_id_repetido_se_deduplica_y_gana_la_ultima():
    resultado = parse_feed(
        make_geojson(
            make_feature(usgs_id="x", mag=4.0),
            make_feature(usgs_id="y"),
            make_feature(usgs_id="x", mag=4.4),
        )
    )
    por_id = {s["usgs_id"]: s for s in resultado.earthquakes}
    assert len(resultado.earthquakes) == 2
    assert por_id["x"]["magnitude"] == 4.4


def test_feed_vacio_no_da_sismos():
    resultado = parse_feed(make_geojson())
    assert resultado.earthquakes == []
    assert resultado.skipped == 0
