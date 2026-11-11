from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.models.earthquake import Earthquake
from app.repositories.earthquakes import list_earthquakes, upsert_earthquake, upsert_many
from app.testing_helpers import NOW


def _sismo(**cambios):
    datos = {
        "usgs_id": "us7000test",
        "title": "M 4.5 - 10 km N of Ficticia",
        "place": "10 km N of Ficticia",
        "magnitude": 4.5,
        "depth": 10.0,
        "latitude": 12.5,
        "longitude": -70.25,
        "occurred_at": datetime(2026, 1, 1, 12, 0, tzinfo=UTC),
        "alert_level": None,
        "tsunami": False,
        "raw_data": {"id": "us7000test"},
    }
    datos.update(cambios)
    return datos


def _total(session) -> int:
    return session.scalar(select(func.count()).select_from(Earthquake))


def test_insertar_guarda_el_sismo(migrated_session):
    upsert_earthquake(migrated_session, _sismo())
    migrated_session.commit()
    guardado = migrated_session.scalars(select(Earthquake)).one()
    assert guardado.usgs_id == "us7000test"
    assert guardado.magnitude == 4.5
    assert guardado.occurred_at == datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
    assert guardado.raw_data == {"id": "us7000test"}


def test_mismo_usgs_id_dos_veces_no_duplica_y_actualiza(migrated_session):
    upsert_earthquake(migrated_session, _sismo(magnitude=4.5))
    upsert_earthquake(migrated_session, _sismo(magnitude=4.8, title="M 4.8 - revisado"))
    migrated_session.commit()
    assert _total(migrated_session) == 1
    guardado = migrated_session.scalars(select(Earthquake)).one()
    assert guardado.magnitude == 4.8
    assert guardado.title == "M 4.8 - revisado"


def test_usgs_id_distintos_son_filas_distintas(migrated_session):
    upsert_earthquake(migrated_session, _sismo(usgs_id="a"))
    upsert_earthquake(migrated_session, _sismo(usgs_id="b"))
    migrated_session.commit()
    assert _total(migrated_session) == 2


def test_magnitud_y_profundidad_nulas_se_admiten(migrated_session):
    upsert_earthquake(migrated_session, _sismo(magnitude=None, depth=None))
    migrated_session.commit()
    guardado = migrated_session.scalars(select(Earthquake)).one()
    assert guardado.magnitude is None
    assert guardado.depth is None


def test_usgs_id_nulo_lo_rechaza_la_base_de_datos(migrated_session):
    migrated_session.add(Earthquake(**_sismo(usgs_id=None)))
    with pytest.raises(IntegrityError):
        migrated_session.commit()


def test_el_indice_unico_rechaza_duplicados_directos(migrated_session):
    migrated_session.add(Earthquake(**_sismo()))
    migrated_session.commit()
    migrated_session.add(Earthquake(**_sismo()))
    with pytest.raises(IntegrityError):
        migrated_session.commit()


# --- upsert_many y list_earthquakes ---------------------------------------------------


def _fila(usgs_id, **cambios):
    return _sismo(usgs_id=usgs_id, occurred_at=NOW - timedelta(minutes=1), **cambios)


def _ids_de(sismos):
    return [s.usgs_id for s in sismos]


def test_upsert_many_guarda_por_lotes_sin_duplicar(migrated_session):
    filas = [_fila(f"id{i}") for i in range(5)]
    upsert_many(migrated_session, filas, chunk_size=2)
    upsert_many(migrated_session, filas, chunk_size=2)
    migrated_session.commit()
    assert _total(migrated_session) == 5


def test_upsert_many_actualiza_los_existentes(migrated_session):
    upsert_many(migrated_session, [_fila("a", magnitude=4.0)])
    upsert_many(migrated_session, [_fila("a", magnitude=4.9)])
    migrated_session.commit()
    assert migrated_session.scalars(select(Earthquake)).one().magnitude == 4.9


def test_upsert_many_con_lista_vacia_no_hace_nada(migrated_session):
    upsert_many(migrated_session, [])
    assert _total(migrated_session) == 0


def _cargar_ejemplo(session):
    upsert_many(
        session,
        [
            _fila("a", magnitude=3.0, depth=10.0, significance=100),
            _fila("b", magnitude=6.0, depth=5.0, significance=None),
            _fila("c", magnitude=None, depth=None, significance=700),
            _fila("d", magnitude=4.0, depth=300.0, significance=300),
        ],
    )
    session.commit()


def test_orden_por_magnitud_deja_los_nulos_al_final(migrated_session):
    _cargar_ejemplo(migrated_session)
    sismos = list_earthquakes(migrated_session, "day", "magnitude", 10, NOW)
    assert _ids_de(sismos) == ["b", "d", "a", "c"]


def test_orden_por_profundidad_deja_los_nulos_al_final(migrated_session):
    _cargar_ejemplo(migrated_session)
    sismos = list_earthquakes(migrated_session, "day", "depth", 10, NOW)
    assert _ids_de(sismos) == ["d", "a", "b", "c"]


def test_orden_por_significancia_deja_los_nulos_al_final(migrated_session):
    _cargar_ejemplo(migrated_session)
    sismos = list_earthquakes(migrated_session, "day", "significance", 10, NOW)
    assert _ids_de(sismos) == ["c", "d", "a", "b"]


def test_orden_reciente_y_desempate_estable(migrated_session):
    upsert_many(
        migrated_session,
        [
            _sismo(usgs_id="viejo", occurred_at=NOW - timedelta(minutes=30)),
            _sismo(usgs_id="nuevo", occurred_at=NOW - timedelta(minutes=2)),
        ],
    )
    migrated_session.commit()
    sismos = list_earthquakes(migrated_session, "day", "recent", 10, NOW)
    assert _ids_de(sismos) == ["nuevo", "viejo"]


def test_empate_de_magnitud_se_resuelve_por_fecha_reciente(migrated_session):
    upsert_many(
        migrated_session,
        [
            _sismo(usgs_id="viejo", magnitude=5.0, occurred_at=NOW - timedelta(minutes=30)),
            _sismo(usgs_id="nuevo", magnitude=5.0, occurred_at=NOW - timedelta(minutes=2)),
        ],
    )
    migrated_session.commit()
    sismos = list_earthquakes(migrated_session, "day", "magnitude", 10, NOW)
    assert _ids_de(sismos) == ["nuevo", "viejo"]


def test_ventana_incluye_el_limite_y_excluye_lo_anterior(migrated_session):
    upsert_many(
        migrated_session,
        [
            _sismo(usgs_id="justo_dentro", occurred_at=NOW - timedelta(hours=1)),
            _sismo(usgs_id="dentro", occurred_at=NOW - timedelta(minutes=59, seconds=59)),
            _sismo(usgs_id="fuera", occurred_at=NOW - timedelta(hours=1, seconds=1)),
        ],
    )
    migrated_session.commit()
    sismos = list_earthquakes(migrated_session, "hour", "recent", 10, NOW)
    assert set(_ids_de(sismos)) == {"justo_dentro", "dentro"}


def test_ventanas_dia_y_semana(migrated_session):
    upsert_many(
        migrated_session,
        [
            _sismo(usgs_id="ayer", occurred_at=NOW - timedelta(hours=23)),
            _sismo(usgs_id="hace_3_dias", occurred_at=NOW - timedelta(days=3)),
            _sismo(usgs_id="hace_8_dias", occurred_at=NOW - timedelta(days=8)),
        ],
    )
    migrated_session.commit()
    assert _ids_de(list_earthquakes(migrated_session, "day", "recent", 10, NOW)) == ["ayer"]
    assert _ids_de(list_earthquakes(migrated_session, "week", "recent", 10, NOW)) == [
        "ayer",
        "hace_3_dias",
    ]


def test_limit_recorta(migrated_session):
    _cargar_ejemplo(migrated_session)
    assert len(list_earthquakes(migrated_session, "day", "recent", 2, NOW)) == 2
