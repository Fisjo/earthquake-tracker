from datetime import UTC, datetime
from functools import lru_cache

from app.usgs.cache import FreshnessCache
from app.usgs.client import UsgsClient


@lru_cache
def get_usgs_client() -> UsgsClient:
    return UsgsClient()


@lru_cache
def get_cache() -> FreshnessCache:
    return FreshnessCache(ttl_seconds=90)


def get_now() -> datetime:
    return datetime.now(UTC)
