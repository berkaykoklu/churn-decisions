# churn-decisions

**[Live site →](https://churn-decisions.berkaykoklu.com)**

A churn model outputs a probability per customer. Acting on it needs a
threshold, and 0.5 is a convention with nothing behind it.

This derives the threshold instead, and shows why the derivation is worthless
unless the probabilities mean what they say.

## Two findings

### Class weighting wrecks the probabilities, and AUC cannot see it

| Model | AUC | Brier | Mean predicted | Actually churned |
|---|---|---|---|---|
| Plain | 0.8541 | 0.1081 | 19.4% | 20.4% |
| **Class-weighted** | 0.8503 | **0.1340** | **34.1%** | 20.4% |
| Calibrated | 0.8567 | 0.1069 | 19.4% | 20.4% |

Class weighting is the standard reflex for imbalanced labels. It moves AUC by
0.004 and inflates the predicted churn rate by **67%** — the model was told the
minority class is more common than it is, so it says so.

AUC measures ranking, and ranking survives any monotonic distortion of the
probabilities. A project reporting only AUC never finds this.

**What it costs:** at the same break-even threshold the class-weighted model
sends a retention offer to **947** customers and the calibrated one to **431**.
More than double the spend, from a model that looks equivalent in review.

### The threshold is arithmetic, not a hyperparameter

Treating a customer pays when

```
p · e · V  >  C
```

for churn probability `p`, the chance the offer works `e`, what it saves `V`,
and what it costs `C`. Rearranged:

```
p* = C / (e · V)
```

The classifier appears nowhere in it. The threshold is a property of the offer,
so changing the offer moves it with no retraining.

| | Threshold | Value on held-out customers |
|---|---|---|
| Derived `p*` | 0.333 | |
| Best on this sample | 0.300 | **21,400** |
| The 0.5 default | 0.500 | 18,750 |

Using 0.5 leaves **12%** of the value on the table. The derived threshold and
the empirical best landing close together is the check that matters: the
arithmetic was not fitted to this sample, so agreement is evidence rather than
a coincidence arranged afterwards.

## How it works

```
data.py       fetch the dataset once, commit it
model.py      train plain / class-weighted / calibrated; reliability curves
economics.py  break-even threshold and the expected-value curve
run.py        → web/public/results.json
web/          static site reading the committed numbers
```

Statistics live in Python. The site reads what was computed and committed
rather than recomputing anything, so the page cannot disagree with the
repository.

## Limits

- **This is bank data, not game data.** Public player telemetry with real
  per-user features barely exists — studios keep it — and a synthetic stand-in
  would mean the numbers measured nothing. The method is what transfers.
- **Cost, value and effectiveness are inputs, not findings.** I do not know a
  bank's real figures. The claim is that the threshold follows from whatever
  they are, which is why the site puts them on a slider.
- **Effectiveness is assumed constant across customers.** In reality an offer
  works differently on different people; estimating that is uplift modelling, a
  harder problem and the honest next step rather than something folded in
  quietly here.
- **One stratified split, one seed.** Repeated splits would put an interval
  around every number.

## Run it

```bash
uv sync
uv run python data.py
uv run python run.py
uv run pytest

cd web && npm install && npm run dev
```

## Licence

MIT.
