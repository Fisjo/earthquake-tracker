import os
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


def _load_dotenv() -> None:
    """Carga `.env` de la raíz sin pisar variables ya definidas en el entorno."""
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def _required(name: str) -> str:
    _load_dotenv()
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Falta {name}: defínela en .env (ver .env.example)")
    return value


def get_database_url() -> str:
    return _required("DATABASE_URL")


def get_test_database_url() -> str:
    url = _required("TEST_DATABASE_URL")
    if url == get_database_url():
        raise RuntimeError("TEST_DATABASE_URL debe ser una base distinta de DATABASE_URL")
    return url
