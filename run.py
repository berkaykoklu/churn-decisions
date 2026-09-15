"""Produce every number the site shows, into one committed file."""

import json
from pathlib import Path

from economics import Offer, best_threshold, value_curve
from model import fit_all, load, reliability, split

OUT = Path("web/public/results.json")

# A worked example, and the site lets a visitor change all three. The point is
# not that these are a bank's real figures -- it is that the threshold follows
# from whatever they are.
OFFER = Offer(cost=50.0, value_saved=500.0, effectiveness=0.30)

# Held fixed while cost moves, so the site can show the break-even point
# tracking the offer without recomputing anything in the browser.
COSTS = [10, 20, 30, 40, 50, 65, 80, 100, 125, 150]


def main() -> None:
    X, y = load()
    X_train, X_test, y_train, y_test = split(X, y)
    churned = y_test.to_numpy()
    models = fit_all(X_train, X_test, y_train, y_test)

    by_name = {m.name: m for m in models}
    decision_model = by_name["Calibrated"]

    # What an inflated model costs when its numbers are used as probabilities:
    # the same rule and the same offer, applied to different inputs.
    at_break_even = {
        m.name: int((m.probabilities >= OFFER.break_even).sum()) for m in models
    }

    curve = value_curve(decision_model.probabilities, churned, OFFER)
    peak = best_threshold(curve)

    cost_sweep = []
    for cost in COSTS:
        offer = Offer(cost=float(cost), value_saved=OFFER.value_saved,
                      effectiveness=OFFER.effectiveness)
        c = value_curve(decision_model.probabilities, churned, offer, steps=51)
        top = best_threshold(c)
        cost_sweep.append(
            {
                "cost": cost,
                "break_even": round(offer.break_even, 4),
                "best_threshold": top["threshold"],
                "value": top["value"],
                "treated": top["treated"],
            }
        )

    results = {
        "n_test": int(len(churned)),
        "churn_rate": round(float(churned.mean()), 4),
        "offer": {
            "cost": OFFER.cost,
            "value_saved": OFFER.value_saved,
            "effectiveness": OFFER.effectiveness,
            "break_even": round(OFFER.break_even, 4),
        },
        "models": [
            {
                "name": m.name,
                "auc": round(m.auc, 4),
                "brier": round(m.brier, 4),
                "mean_predicted": round(float(m.probabilities.mean()), 4),
                "treated_at_break_even": at_break_even[m.name],
                "reliability": reliability(m.probabilities, churned),
            }
            for m in models
        ],
        "value_curve": curve,
        "peak": peak,
        "value_at_half": next(r for r in curve if r["threshold"] == 0.5),
        "cost_sweep": cost_sweep,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(results, indent=2))

    print(f"held out {results['n_test']:,} customers, {results['churn_rate']:.1%} churned")
    for m in results["models"]:
        print(
            f"  {m['name']:16} AUC {m['auc']:.4f}  Brier {m['brier']:.4f}  "
            f"mean p {m['mean_predicted']:.3f}  treats {m['treated_at_break_even']:,}"
        )
    print(f"\n  break-even threshold: {results['offer']['break_even']:.3f}")
    print(f"  best on this sample:  {peak['threshold']:.3f}  -> {peak['value']:,.0f}")
    print(f"  at the 0.5 default:   0.500  -> {results['value_at_half']['value']:,.0f}")


if __name__ == "__main__":
    main()
