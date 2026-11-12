import pytest

from app.stats.regions import extract_region
from app.stats.us_states import US_STATES


@pytest.mark.parametrize(
    ("place", "esperado"),
    [
        ("21 km WNW of Popondetta, Papua New Guinea", "Papua New Guinea"),
        ("10 km SW of Hawthorne, Nevada", "Nevada"),
        ("27 km WSW of Calama, Chile", "Chile"),
        ("Pulau Pulau Tanimbar, Indonesia", "Indonesia"),
        ("Mid-Indian Ridge", "Mid-Indian Ridge"),
        ("South Sandwich Islands region", "South Sandwich Islands region"),
        ("5 km N of Ficticia", "Ficticia"),
        ("2.5 km ENE of Pueblo, Provincia, País", "País"),
        ("Algo,", "Algo"),
        ("  15 km S of Lima ,  Peru  ", "Peru"),
    ],
)
def test_extrae_la_region(place, esperado):
    assert extract_region(place) == esperado


@pytest.mark.parametrize("place", [None, "", "   ", ",", "10 km N of "])
def test_sin_lugar_utilizable_no_hay_region(place):
    assert extract_region(place) is None


# --- siglas de estados de EE. UU. ----------------------------------------------------


def test_la_tabla_cubre_50_estados_dc_y_5_territorios():
    assert len(US_STATES) == 56
    assert US_STATES["CA"] == "California"
    assert US_STATES["DC"] == "District of Columbia"
    assert US_STATES["PR"] == "Puerto Rico"


@pytest.mark.parametrize(("sigla", "nombre"), sorted(US_STATES.items()))
def test_cada_sigla_se_traduce_a_su_nombre(sigla, nombre):
    assert extract_region(f"7 km WNW of Ficticia, {sigla}") == nombre


@pytest.mark.parametrize(
    ("place", "esperado"),
    [
        ("7 km WNW of Cobb, CA", "California"),
        ("Washington, DC", "District of Columbia"),
        ("3 km S of Pueblo, Alaska", "Alaska"),
        ("Mid-Indian Ridge", "Mid-Indian Ridge"),
        ("27 km WSW of Calama, Chile", "Chile"),
        ("5 km N of Town, ca", "ca"),
        ("5 km N of Town, Cal", "Cal"),
        ("CA", "California"),
    ],
)
def test_solo_se_traducen_siglas_exactas_en_mayusculas(place, esperado):
    assert extract_region(place) == esperado
