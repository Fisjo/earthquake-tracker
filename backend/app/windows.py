from datetime import timedelta
from typing import Literal

Window = Literal["hour", "day", "week"]
SortKey = Literal["recent", "magnitude", "depth", "significance"]

WINDOW_DURATION: dict[str, timedelta] = {
    "hour": timedelta(hours=1),
    "day": timedelta(days=1),
    "week": timedelta(days=7),
}
