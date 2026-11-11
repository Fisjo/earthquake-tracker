from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_database_url


class Base(DeclarativeBase):
    pass


def make_session_factory() -> sessionmaker:
    return sessionmaker(create_engine(get_database_url()))


@lru_cache
def _session_factory() -> sessionmaker:
    return make_session_factory()


def get_session() -> Iterator[Session]:
    with _session_factory()() as session:
        yield session
