"""Conservative strength method selection against the best baseline."""

from __future__ import annotations

from typing import Literal

import pandas as pd

from metaform_ds.modeling.strength.config import StrengthModelConfig
from metaform_ds.modeling.strength.metrics import (
    best_baseline,
    relative_mae_improvement,
)

Recommendation = Literal[
    "INSUFFICIENT_DATA", "BASELINE_PREFERRED", "ML_CANDIDATE_PROMISING"
]


def select_preferred_method(
    comparison: pd.DataFrame,
    stability: pd.DataFrame,
    *,
    config: StrengthModelConfig,
) -> tuple[str | None, Recommendation, pd.DataFrame]:
    baseline = best_baseline(comparison)
    if baseline is None:
        return None, "INSUFFICIENT_DATA", pd.DataFrame()
    indexed = comparison.set_index("method")
    baseline_mae = float(str(indexed.loc[baseline, "mae_kg"]))
    rows: list[dict[str, object]] = []
    qualified: list[tuple[str, float]] = []
    for method in ("Linear Regression", "Ridge Regression"):
        row = indexed.loc[method]
        mae = float(str(row["mae_kg"]))
        improvement = relative_mae_improvement(baseline_mae, mae)
        enough = (
            int(float(str(row["prediction_count"])))
            >= config.minimum_selection_predictions
        )
        stability_row = stability.loc[stability["method"].eq(method)]
        cv = None if stability_row.empty else stability_row.iloc[0]["fold_mae_cv"]
        stable = (
            cv is not None
            and not pd.isna(cv)
            and float(cv) <= config.maximum_fold_mae_cv
        )
        selected = (
            enough and stable and improvement >= config.meaningful_improvement_percent
        )
        rows.append(
            {
                "method": method,
                "improvement_vs_best_baseline_percent": improvement,
                "enough_predictions": enough,
                "temporally_stable": stable,
                "selected": selected,
            }
        )
        if selected:
            qualified.append((method, mae))
    if not qualified:
        return baseline, "BASELINE_PREFERRED", pd.DataFrame(rows)
    preferred = min(qualified, key=lambda item: item[1])[0]
    return preferred, "ML_CANDIDATE_PROMISING", pd.DataFrame(rows)
