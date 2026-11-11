from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Earthquake(Base):
    __tablename__ = "earthquakes"

    id: Mapped[int] = mapped_column(primary_key=True)
    usgs_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    place: Mapped[str | None] = mapped_column(String(255))
    magnitude: Mapped[float | None] = mapped_column(Float)
    depth: Mapped[float | None] = mapped_column(Float)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    alert_level: Mapped[str | None] = mapped_column(String(16))
    tsunami: Mapped[bool] = mapped_column(default=False)
    significance: Mapped[int | None] = mapped_column(Integer, index=True)
    raw_data: Mapped[dict] = mapped_column(JSONB)
