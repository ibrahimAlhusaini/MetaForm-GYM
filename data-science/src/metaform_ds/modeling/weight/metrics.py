"""Small-sample-safe regression metrics and comparison tables."""

from __future__ import annotations

from dataclasses import dataclass
from math import sqrt

import numpy as np
import pandas as pd


@dataclass(frozen=True, slots=True)
class RegressionMetrics:
    mae_kg: float | None
    rmse_kg: float | None
    r2: float | None
    prediction_count: int


def regression_metrics(actual: pd.Series, predicted: pd.Series) -> RegressionMetrics:
    """Calculate metrics without fabricating R² for invalid sample shapes."""
    paired = pd.DataFrame({"actual": actual, "predicted": predicted}).dropna()
    if paired.empty:
        return RegressionMetrics(None, None, None, 0)
    errors = paired["actual"].astype(float) - paired["predicted"].astype(float)
    mae = float(errors.abs().mean())
    rmse = sqrt(float(np.square(errors).mean()))
    actual_values = paired["actual"].astype(float)
    total_variance = float(np.square(actual_values - actual_values.mean()).sum())
    r2 = None
    if len(paired) >= 2 and total_variance > 0:
        residual = float(np.square(errors).sum())
        r2 = 1 - residual / total_variance
    return RegressionMetrics(mae, rmse, r2, len(paired))


def metric_comparison(predictions: pd.DataFrame) -> pd.DataFrame:
    """Compare both baselines and regression on an identical prediction set."""
    columns = ["model", "mae_kg", "rmse_kg", "r2", "prediction_count"]
    if predictions.empty:
        return pd.DataFrame(columns=columns)
    mapping = {
        "Last Value Baseline": "baseline_last_value_kg",
        "Recent Trend Baseline": "baseline_trend_kg",
        "Linear Regression": "predicted_weight_kg",
    }
    rows: list[dict[str, object]] = []
    for name, prediction_column in mapping.items():
        metrics = regression_metrics(
            predictions["actual_weight_kg"], predictions[prediction_column]
        )
        rows.append(
            {
                "model": name,
                "mae_kg": metrics.mae_kg,
                "rmse_kg": metrics.rmse_kg,
                "r2": metrics.r2,
                "prediction_count": metrics.prediction_count,
            }
        )
    return (
        pd.DataFrame(rows, columns=columns)
        .sort_values("mae_kg", kind="stable", na_position="last")
        .reset_index(drop=True)
    )


def best_model_name(comparison: pd.DataFrame) -> str | None:
    valid = comparison.dropna(subset=["mae_kg"])
    return str(valid.iloc[0]["model"]) if not valid.empty else None
