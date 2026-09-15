"""Checks with answers you can work out on paper."""

import numpy as np
import pytest

from economics import Offer, best_threshold, expected_value, value_curve


def test_break_even_is_cost_over_expected_saving() -> None:
    # 50 to make the offer, 500 saved when it works, works 30% of the time.
    # 50 / (0.3 * 500) = 50 / 150 = 1/3.
    assert Offer(50, 500, 0.3).break_even == pytest.approx(1 / 3)


def test_a_cheaper_offer_is_worth_making_to_less_likely_churners() -> None:
    assert Offer(10, 500, 0.3).break_even < Offer(100, 500, 0.3).break_even


def test_an_offer_that_saves_nothing_is_never_worth_making() -> None:
    assert Offer(50, 0, 0.5).break_even == float("inf")


def test_an_offer_must_have_a_chance_of_working() -> None:
    with pytest.raises(ValueError):
        Offer(50, 500, 0.0)
    with pytest.raises(ValueError):
        Offer(50, 500, 1.5)


def test_expected_value_charges_for_everyone_contacted() -> None:
    # Two customers treated, one of whom churns. Saved 1 * 0.5 * 100 = 50,
    # paid 2 * 10 = 20, so 30.
    p = np.array([0.9, 0.8, 0.1])
    churned = np.array([1, 0, 1])

    assert expected_value(p, churned, Offer(10, 100, 0.5), 0.5) == pytest.approx(30.0)


def test_treating_nobody_is_worth_nothing_rather_than_a_loss() -> None:
    p = np.array([0.1, 0.2])
    assert expected_value(p, np.array([1, 0]), Offer(10, 100, 0.5), 0.99) == 0.0


def test_treating_a_customer_who_stays_is_pure_cost() -> None:
    p = np.array([0.9])
    assert expected_value(p, np.array([0]), Offer(10, 100, 0.5), 0.5) == pytest.approx(-10.0)


def test_the_curve_spans_every_threshold_and_finds_its_own_peak() -> None:
    rng = np.random.default_rng(0)
    p = rng.random(500)
    churned = (rng.random(500) < p).astype(int)
    curve = value_curve(p, churned, Offer(10, 100, 0.5))

    assert curve[0]["threshold"] == 0.0
    assert curve[-1]["threshold"] == 1.0
    assert best_threshold(curve)["value"] == max(row["value"] for row in curve)


def test_fewer_customers_are_treated_as_the_threshold_rises() -> None:
    rng = np.random.default_rng(1)
    p = rng.random(300)
    curve = value_curve(p, (rng.random(300) < 0.3).astype(int), Offer(10, 100, 0.5))
    treated = [row["treated"] for row in curve]

    assert treated == sorted(treated, reverse=True)
