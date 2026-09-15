"""Training, and whether the probabilities can be believed.

Two models are trained on the same data for the same reason a control exists:
one plain, one with the class weighting routinely applied to imbalanced
labels. The weighted model ranks slightly better and its probabilities are
badly wrong -- it has been told the minority class is more common than it is,
so it says so. Ranking metrics cannot see this, which is why a project that
reports only AUC never finds it.

That matters here specifically. The decision rule in economics.py compares a
probability against a break-even point. Feed it inflated probabilities and it
treats customers it should not, confidently.
"""

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import brier_score_loss, roc_auc_score
from sklearn.model_selection import train_test_split

SEED = 20260915
TARGET = "Churn"
DROP = ["CustomerId", "Surname"]


@dataclass
class Fitted:
    name: str
    probabilities: np.ndarray
    auc: float
    brier: float


def load(path: str = "data/churn.csv") -> tuple[pd.DataFrame, pd.Series]:
    frame = pd.read_csv(path).drop(columns=DROP)
    y = frame.pop(TARGET).astype(int)
    for column in frame.select_dtypes("object"):
        frame[column] = frame[column].astype("category")
    return frame, y


def split(X: pd.DataFrame, y: pd.Series):
    """Stratified, so the held-out set carries the same churn rate.

    Everything reported is measured here. Calibration judged on data the model
    was fitted to would look perfect and mean nothing.
    """
    return train_test_split(X, y, test_size=0.25, random_state=SEED, stratify=y)


def _base(weighted: bool) -> HistGradientBoostingClassifier:
    return HistGradientBoostingClassifier(
        max_iter=300,
        learning_rate=0.06,
        max_leaf_nodes=24,
        early_stopping=True,
        validation_fraction=0.15,
        random_state=SEED,
        categorical_features="from_dtype",
        class_weight="balanced" if weighted else None,
    )


def fit_all(X_train, X_test, y_train, y_test) -> list[Fitted]:
    """Plain, class-weighted, and plain-then-calibrated.

    The third is the first with isotonic regression fitted on held-out folds,
    which maps raw scores onto probabilities that match observed frequencies.
    It is the one the decision rule should use.
    """
    out: list[Fitted] = []

    for name, weighted in (("Plain", False), ("Class-weighted", True)):
        model = _base(weighted).fit(X_train, y_train)
        p = model.predict_proba(X_test)[:, 1]
        out.append(
            Fitted(name, p, float(roc_auc_score(y_test, p)), float(brier_score_loss(y_test, p)))
        )

    calibrated = CalibratedClassifierCV(_base(False), method="isotonic", cv=5)
    calibrated.fit(X_train, y_train)
    p = calibrated.predict_proba(X_test)[:, 1]
    out.append(
        Fitted("Calibrated", p, float(roc_auc_score(y_test, p)), float(brier_score_loss(y_test, p)))
    )
    return out


def reliability(probabilities: np.ndarray, churned: np.ndarray, bins: int = 10) -> list[dict]:
    """Predicted probability against the rate that actually occurred.

    A model that says 30% should be right 30% of the time. Equal-width bins
    over [0,1]; empty ones are dropped rather than drawn at zero, which would
    invent a point the data never made.
    """
    edges = np.linspace(0, 1, bins + 1)
    rows = []
    for lo, hi in zip(edges[:-1], edges[1:], strict=True):
        in_bin = (probabilities >= lo) & (probabilities < hi if hi < 1 else probabilities <= hi)
        if not in_bin.any():
            continue
        rows.append(
            {
                "predicted": round(float(probabilities[in_bin].mean()), 4),
                "observed": round(float(churned[in_bin].mean()), 4),
                "count": int(in_bin.sum()),
            }
        )
    return rows
