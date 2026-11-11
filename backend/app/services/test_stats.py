from datetime import timedelta

from app.repositories.earthquakes import upsert_many
from app.services.stats import compute_stats
from app.testing_helpers import NOW


def _fila(usgs_id, horas_atras, place="1 km N of X, Chile", mag=4.0):
    return {
        "usgs_id": usgs_id,
        "title": f"sismo {usgs_id}",
        "place": place,
        "magnitude": mag,
        "depth": 10.0,
        "latitude": 0.0,
        "longitude": 0.0,
        "occurred_at": NOW - timedelta(hours=horas_atras),
        "alert_level": None,
        "tsunami": False,
        "significance": None,
        "raw_data": {},
    }


def _cargar(session, *filas):
    upsert_many(session, list(filas))
    session.commit()


def test_base_vacia_no_da_datos(migrated_session):
    stats = compute_stats(migrated_session, NOW)
    assert stats.total_24h == 0
    assert stats.max_magnitude is None
    assert stats.most_active_region is None


def test_total_maximo_y_zona_mas_activa(migrated_session):
    _cargar(
        migrated_session,
        _fila("a", 1, "5 km N of Santiago, Chile", mag=4.0),
        _fila("b", 2, "9 km S of Calama, Chile", mag=5.5),
        _fila("c", 3, "10 km SW of Hawthorne, Nevada", mag=3.1),
    )
    stats = compute_stats(migrated_session, NOW)
    assert stats.total_24h == 3
    assert stats.max_magnitude == 5.5
    assert stats.most_active_region.name == "Chile"
    assert stats.most_active_region.count == 2


def test_las_24_horas_incluyen_el_limite_y_excluyen_lo_anterior(migrated_session):
    _cargar(
        migrated_session,
        _fila("justo_dentro", 24, mag=3.0),
        _fila("fuera", 24 + 1 / 3600, mag=8.0),
    )
    stats = compute_stats(migrated_session, NOW)
    assert stats.total_24h == 1
    assert stats.max_magnitude == 3.0


def test_magnitud_nula_se_ignora_en_el_maximo_pero_cuenta_en_el_total(migrated_session):
    _cargar(migrated_session, _fila("a", 1, mag=None), _fila("b", 2, mag=2.5))
    stats = compute_stats(migrated_session, NOW)
    assert stats.total_24h == 2
    assert stats.max_magnitude == 2.5


def test_solo_magnitudes_nulas_da_maximo_nulo(migrated_session):
    _cargar(migrated_session, _fila("a", 1, mag=None))
    assert compute_stats(migrated_session, NOW).max_magnitude is None


def test_empate_de_zonas_gana_la_primera_alfabeticamente(migrated_session):
    _cargar(
        migrated_session,
        _fila("a", 1, "1 km N of X, Chile"),
        _fila("b", 2, "1 km N of Y, Alaska"),
    )
    region = compute_stats(migrated_session, NOW).most_active_region
    assert region.name == "Alaska"
    assert region.count == 1


def test_sismos_sin_lugar_cuentan_en_el_total_pero_no_en_zonas(migrated_session):
    _cargar(migrated_session, _fila("a", 1, place=None), _fila("b", 2, place=""))
    stats = compute_stats(migrated_session, NOW)
    assert stats.total_24h == 2
    assert stats.most_active_region is None
