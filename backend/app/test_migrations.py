from alembic import command
from sqlalchemy import inspect

from app.conftest import alembic_config


def test_migracion_se_aplica_y_se_revierte(empty_db, test_db_url):
    config = alembic_config(test_db_url)
    assert "earthquakes" not in inspect(empty_db).get_table_names()

    command.upgrade(config, "head")
    inspector = inspect(empty_db)
    assert "earthquakes" in inspector.get_table_names()
    columnas = {c["name"] for c in inspector.get_columns("earthquakes")}
    assert {
        "usgs_id",
        "title",
        "place",
        "magnitude",
        "depth",
        "latitude",
        "longitude",
        "occurred_at",
        "alert_level",
        "tsunami",
        "raw_data",
    } <= columnas
    indices_unicos = [
        i["column_names"] for i in inspector.get_indexes("earthquakes") if i["unique"]
    ]
    assert ["usgs_id"] in indices_unicos

    command.downgrade(config, "base")
    assert "earthquakes" not in inspect(empty_db).get_table_names()
