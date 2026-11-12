import re

from app.stats.us_states import US_STATES

# «21 km WNW of » al inicio del lugar de USGS.
_DISTANCE_PREFIX = re.compile(r"^\s*\d+(?:\.\d+)?\s*km\s+[NSEW]{1,3}\s+of\s+", re.IGNORECASE)


def extract_region(place: str | None) -> str | None:
    """Región de un `place` de USGS: lo que va tras la última coma, sin el prefijo de distancia.

    «21 km WNW of Popondetta, Papua New Guinea» -> «Papua New Guinea»;
    «Mid-Indian Ridge» (sin coma) se queda tal cual. Las siglas de estados de EE. UU. («CA») se
    traducen a su nombre («California»).
    """
    if not place:
        return None
    text = _DISTANCE_PREFIX.sub("", place).strip()
    region = text.rstrip(", ").rsplit(",", 1)[-1].strip()
    return US_STATES.get(region, region) or None
