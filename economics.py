"""Turning a probability into a decision.

A churn model outputs a number per customer. Acting on it needs a threshold,
and 0.5 is a convention with nothing behind it. The threshold follows from the
economics, and it can be derived rather than tuned:

    intervene when   p · e · V  >  C

for churn probability p, the chance the intervention works e, the value saved
V, and its cost C. Rearranged, the break-even probability is

    p* = C / (e · V)

which is the whole argument. Nothing about the model appears in it -- the
threshold is a property of the offer, not of the classifier. Change the cost
of the offer and the right threshold moves, with no retraining.

This only holds if the probabilities mean what they say, which is why
calibration is measured before any of it is used. A model whose "30%" is
really 45% will act on p* correctly and still be wrong.
"""

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class Offer:
    """What a retention action costs and what it is worth when it works."""

    cost: float
    value_saved: float
    effectiveness: float

    def __post_init__(self) -> None:
        if not 0 < self.effectiveness <= 1:
            raise ValueError("effectiveness is a probability above zero")
        if self.cost < 0 or self.value_saved < 0:
            raise ValueError("cost and value are not negative")

    @property
    def break_even(self) -> float:
        """The probability above which acting pays. Derived, not chosen."""
        denominator = self.effectiveness * self.value_saved
        # An offer that saves nothing is never worth making, at any probability.
        return float("inf") if denominator == 0 else self.cost / denominator


def expected_value(probabilities: np.ndarray, churned: np.ndarray, offer: Offer,
                   threshold: float) -> float:
    """Value of treating everyone above the threshold, on held-out customers.

    Cost is paid for every customer contacted, including the ones who were
    never going to leave -- which is exactly what makes a low threshold
    expensive. Value is credited only where the customer really did churn and
    the intervention lands.
    """
    treated = probabilities >= threshold
    if not treated.any():
        return 0.0
    saved = (treated & (churned == 1)).sum() * offer.effectiveness * offer.value_saved
    return float(saved - treated.sum() * offer.cost)


def value_curve(probabilities: np.ndarray, churned: np.ndarray, offer: Offer,
                steps: int = 101) -> list[dict]:
    """Expected value across every threshold, so the peak can be seen."""
    return [
        {
            "threshold": round(t, 3),
            "value": round(expected_value(probabilities, churned, offer, t), 2),
            "treated": int((probabilities >= t).sum()),
        }
        for t in np.linspace(0.0, 1.0, steps)
    ]


def best_threshold(curve: list[dict]) -> dict:
    """The threshold that actually maximises value on this sample.

    Reported next to the derived break-even point rather than instead of it:
    where they disagree, the gap is sampling noise or miscalibration, and
    seeing the two together is what tells you which.
    """
    return max(curve, key=lambda row: row["value"])
