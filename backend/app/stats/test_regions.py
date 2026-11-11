import pytest

from app.stats.regions import extract_region


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
