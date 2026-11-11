import pytest

from app.config import get_database_url, get_test_database_url


def test_database_url_sale_del_entorno(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@localhost/dev")
    assert get_database_url() == "postgresql+psycopg://u:p@localhost/dev"


def test_database_url_ausente_da_error_claro(monkeypatch):
    monkeypatch.setattr("app.config._load_dotenv", lambda: None)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        get_database_url()


def test_base_de_pruebas_no_puede_ser_la_de_desarrollo(monkeypatch):
    url = "postgresql+psycopg://u:p@localhost/dev"
    monkeypatch.setenv("DATABASE_URL", url)
    monkeypatch.setenv("TEST_DATABASE_URL", url)
    with pytest.raises(RuntimeError, match="distinta"):
        get_test_database_url()


def test_base_de_pruebas_distinta_se_acepta(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@localhost/dev")
    monkeypatch.setenv("TEST_DATABASE_URL", "postgresql+psycopg://u:p@localhost/dev_test")
    assert get_test_database_url().endswith("/dev_test")
