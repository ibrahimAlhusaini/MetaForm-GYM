"""Small-sample-safe strength regression and direction metrics."""

from __future__ import annotations

from dataclasses import dataclass
from math import sqrt

import numpy as np
import pandas as pd

PREDICTION_COLUMNS = {
    "Last Session Baseline": "baseline_last_session_kg",
    "Recent Trend Baseline": "baseline_recent_trend_kg",
    "Linear Regression": "linear_prediction_kg",
    "Ridge Regression": "ridge_prediction_kg",
}


@dataclass(frozen=True, slots=True)
class StrengthMetrics:
    mae_kg: float | None
    rmse_kg: float | None
    r2: float | None
    prediction_count: int
    direction_accuracy: float | None


def _direction(change: pd.Series, tolerance: float) -> pd.Series:
    return pd.Series(
        np.select(
            [change.gt(tolerance), change.lt(-tolerance)],
            ["INCREASE", "DECREASE"],
            default="STABLE",
        ),
        index=change.index,
    )


def regression_metrics(
    actual: pd.Series,
    predicted: pd.Series,
    *,
    current: pd.Series | None = None,
    direction_tolerance_kg: float = 0.5,
) -> StrengthMetrics:
    frame = pd.DataFrame({"actual": actual, "predicted": predicted})
    if current is not None:
        frame["current"] = current
    paired = frame.dropna()
    if paired.empty:
        return StrengthMetrics(None, None, None, 0, None)
    errors = paired["actual"].astype(float) - paired["predicted"].astype(float)
    mae = float(errors.abs().mean())
    rmse = sqrt(float(np.square(errors).mean()))
    actual_values = paired["actual"].astype(float)
    variance = float(np.square(actual_values - actual_values.mean()).sum())
    r2 = (
        None
        if len(paired) < 2 or variance == 0
        else 1 - float(np.square(errors).sum()) / variance
    )
    direction = None
    if current is not None:
        actual_direction = _direction(
            actual_values - paired["current"].astype(float), direction_tolerance_kg
        )
        predicted_direction = _direction(
            paired["predicted"].astype(float) - paired["current"].astype(float),
            direction_tolerance_kg,
        )
        direction = float(actual_direction.eq(predicted_direction).mean())
    return StrengthMetrics(mae, rmse, r2, len(paired), direction)


def metric_comparison(
    predictions: pd.DataFrame, *, tolerance: float = 0.5
) -> pd.DataFrame:
    columns = [
        "method",
        "mae_kg",
        "rmse_kg",
        "r2",
        "prediction_count",
        "direction_accuracy",
    ]
    if predictions.empty:
        return pd.DataFrame(columns=columns)
    rows: list[dict[str, object]] = []
    for method, column in PREDICTION_COLUMNS.items():
        metrics = regression_metrics(
            predictions["actual_next_max_weight_kg"],
            predictions[column],
            current=predictions["current_max_weight_kg"],
            direction_tolerance_kg=tolerance,
        )
        rows.append(
            {
                "method": method,
                "mae_kg": metrics.mae_kg,
                "rmse_kg": metrics.rmse_kg,
                "r2": metrics.r2,
                "prediction_count": metrics.prediction_count,
                "direction_accuracy": metrics.direction_accuracy,
            }
        )
    return (
        pd.DataFrame(rows, columns=columns)
        .sort_values("mae_kg", kind="stable")
        .reset_index(drop=True)
    )


def best_baseline(comparison: pd.DataFrame) -> str | None:
    baselines = comparison.loc[
        comparison["method"].isin(["Last Session Baseline", "Recent Trend Baseline"])
    ].dropna(subset=["mae_kg"])
    return (
        str(baselines.sort_values("mae_kg", kind="stable").iloc[0]["method"])
        if not baselines.empty
        else None
    )


def relative_mae_improvement(baseline_mae: float, candidate_mae: float) -> float:
    if baseline_mae == 0:
        return 0.0 if candidate_mae == 0 else float("-inf")
    return (baseline_mae - candidate_mae) / baseline_mae * 100
