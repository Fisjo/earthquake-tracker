from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.earthquake import Earthquake


def upsert_earthquake(session: Session, data: dict) -> Earthquake:
    """Inserta el sismo o actualiza el existente con el mismo `usgs_id`."""
    stmt = insert(Earthquake).values(**data)
    changes = {k: stmt.excluded[k] for k in data if k != "usgs_id"}
    stmt = stmt.on_conflict_do_update(index_elements=["usgs_id"], set_=changes)
    return session.scalars(
        stmt.returning(Earthquake), execution_options={"populate_existing": True}
    ).one()
