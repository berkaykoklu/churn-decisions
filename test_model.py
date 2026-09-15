"""The claim the project rests on, checked rather than asserted."""

import numpy as np
import pytest

from model import reliability


def test_a_perfectly_calibrated_model_sits_on_the_diagonal() -> None:
    # Every customer given a 30% chance, and 30% of them churn.
    rng = np.random.default_rng(3)
    p = np.full(4000, 0.3)
    churned = (rng.random(4000) < 0.3).astype(int)

    row = reliability(p, churned)[0]

    assert row["predicted"] == pytest.approx(0.3)
    assert row["observed"] == pytest.approx(0.3, abs=0.03)


def test_an_inflated_model_sits_below_it() -> None:
    # Says 60%, only 30% churn -- exactly the class-weighting failure, and the
    # reliability curve is where it becomes visible.
    rng = np.random.default_rng(4)
    p = np.full(4000, 0.6)
    churned = (rng.random(4000) < 0.3).astype(int)

    row = reliability(p, churned)[0]

    assert row["observed"] < row["predicted"] - 0.2


def test_empty_bins_are_dropped_rather_than_drawn_at_zero() -> None:
    # Nothing between 0.3 and 1.0, so those bins should not appear at all --
    # plotting them as zero would invent points the data never made.
    p = np.concatenate([np.full(50, 0.05), np.full(50, 0.25)])
    churned = np.zeros(100, dtype=int)

    assert len(reliability(p, churned)) == 2


def test_every_bin_reports_how_many_customers_it_holds() -> None:
    rng = np.random.default_rng(5)
    p = rng.random(1000)
    rows = reliability(p, (rng.random(1000) < p).astype(int))

    assert sum(r["count"] for r in rows) == 1000
