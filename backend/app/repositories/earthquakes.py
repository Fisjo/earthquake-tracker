from datetime import datetime

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.earthquake import Earthquake
from app.windows import WINDOW_DURATION, SortKey, Window

# 12 columnas por fila: 1000 filas por lote quedan lejos del límite de parámetros de Postgres.
CHUNK_SIZE = 1000


def _upsert_statement(rows: list[dict]):
    stmt = insert(Earthquake).values(rows)
    changes = {k: stmt.excluded[k] for k in rows[0] if k != "usgs_id"}
    return stmt.on_conflict_do_update(index_elements=["usgs_id"], set_=changes)


def upsert_earthquake(session: Session, data: dict) -> Earthquake:
    """Inserta el sismo o actualiza el existente con el mismo `usgs_id`."""
    stmt = _upsert_statement([data])
    return session.scalars(
        stmt.returning(Earthquake), execution_options={"populate_existing": True}
    ).one()


def upsert_many(session: Session, rows: list[dict], chunk_size: int = CHUNK_SIZE) -> None:
    """Upsert por lotes. Los `usgs_id` de `rows` deben ser únicos entre sí."""
    for start in range(0, len(rows), chunk_size):
        session.execute(_upsert_statement(rows[start : start + chunk_size]))


def _order_by(sort: SortKey) -> list:
    recent = [Earthquake.occurred_at.desc(), Earthquake.id.desc()]
    column = {
        "magnitude": Earthquake.magnitude,
        "depth": Earthquake.depth,
        "significance": Earthquake.significance,
    }.get(sort)
    if column is None:
        return recent
    return [column.desc().nulls_last(), *recent]


def list_earthquakes(
    session: Session, window: Window, sort: SortKey, limit: int, now: datetime
) -> list[Earthquake]:
    since = now - WINDOW_DURATION[window]
    stmt = (
        select(Earthquake)
        .where(Earthquake.occurred_at >= since)
        .order_by(*_order_by(sort))
        .limit(limit)
    )
    return list(session.scalars(stmt))
