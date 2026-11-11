from datetime import UTC, datetime

import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.models.earthquake import Earthquake
from app.repositories.earthquakes import upsert_earthquake


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
