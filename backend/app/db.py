from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_database_url


class Base(DeclarativeBase):
    pass


def make_session_factory() -> sessionmaker:
    return sessionmaker(create_engine(get_database_url()))
