"""Fetch the dataset once and commit it.

Ten thousand retail bank customers, one in five of whom left. Committed rather
than fetched at run time so every figure on the site can be reproduced from
this repository alone.

Not a games dataset, and the site says so. Public player telemetry with real
per-user features barely exists -- studios keep it -- and a synthetic stand-in
would mean the numbers measured nothing. The method here is the part that
transfers; the domain is where the data is.
"""

import urllib.request
from pathlib import Path

URL = (
    "https://raw.githubusercontent.com/YBI-Foundation/Dataset/main/"
    "Bank%20Churn%20Modelling.csv"
)
OUT = Path("data/churn.csv")


def main() -> None:
    OUT.parent.mkdir(exist_ok=True)
    if OUT.exists():
        print(f"{OUT} already here ({OUT.stat().st_size:,} bytes)")
        return
    urllib.request.urlretrieve(URL, OUT)  # noqa: S310 - fixed https URL
    print(f"wrote {OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
