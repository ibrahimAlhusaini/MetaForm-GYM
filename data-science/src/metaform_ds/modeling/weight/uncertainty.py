"""Causal empirical prediction intervals from prior out-of-fold residuals."""

from __future__ import annotations

import numpy as np
import pandas as pd

from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.metrics import MODEL_PREDICTION_COLUMNS


def empirical_error_quantile(residuals: pd.Series, coverage: float) -> float:
    """Return a conservative observed absolute-error quantile."""
    values = pd.to_numeric(residuals, errors="coerce").dropna().to_numpy()
    if len(values) == 0:
        raise ValueError("At least one residual is required")
    return float(np.quantile(values, coverage, method="higher"))


def empirical_intervals(
    predictions: pd.DataFrame, config: WeightModelConfig
) -> pd.DataFrame:
    columns = [
        "anonymous_user_id",
        "model",
        "prediction_date",
        "target_date",
        "actual_weight_kg",
        "point_prediction_kg",
        "lower_bound_kg",
        "upper_bound_kg",
        "interval_available",
        "interval_method",
        "interval_coverage_target",
        "residual_sample_count",
        "interval_abstention_reason",
    ]
    if predictions.empty:
        return pd.DataFrame(columns=columns)
    ordered = predictions.sort_values(
        ["prediction_date", "anonymous_user_id", "target_date"], kind="stable"
    ).reset_index(drop=True)
    rows: list[dict[str, object]] = []
    for _, current in ordered.iterrows():
        origin = pd.Timestamp(current["prediction_date"])
        available = ordered.loc[ordered["target_date"].lt(origin)]
        for model, prediction_column in MODEL_PREDICTION_COLUMNS.items():
            residuals = (
                available["actual_weight_kg"] - available[prediction_column]
            ).abs()
            residual_count = int(residuals.notna().sum())
            point = float(current[prediction_column])
            is_available = residual_count >= config.minimum_interval_residuals
            error_quantile = (
                empirical_error_quantile(residuals, config.interval_coverage)
                if is_available
                else None
            )
            rows.append(
                {
                    "anonymous_user_id": str(current["anonymous_user_id"]),
                    "model": model,
                    "prediction_date": origin,
                    "target_date": current["target_date"],
                    "actual_weight_kg": float(current["actual_weight_kg"]),
                    "point_prediction_kg": point,
                    "lower_bound_kg": (
                        point - error_quantile if error_quantile is not None else None
                    ),
                    "upper_bound_kg": (
                        point + error_quantile if error_quantile is not None else None
                    ),
                    "interval_available": is_available,
                    "interval_method": "PAST_OOF_ABSOLUTE_RESIDUAL_QUANTILE",
                    "interval_coverage_target": config.interval_coverage,
                    "residual_sample_count": residual_count,
                    "interval_abstention_reason": (
                        None if is_available else "INSUFFICIENT_PAST_RESIDUALS"
                    ),
                }
            )
    return pd.DataFrame(rows, columns=columns)


def interval_diagnostics(intervals: pd.DataFrame) -> pd.DataFrame:
    columns = [
        "model",
        "interval_prediction_count",
        "missing_interval_count",
        "empirical_coverage_rate",
        "average_interval_width_kg",
    ]
    if intervals.empty:
        return pd.DataFrame(columns=columns)
    rows: list[dict[str, object]] = []
    for model, group in intervals.groupby("model", sort=True):
        available = group.loc[group["interval_available"]]
        covered = available["actual_weight_kg"].ge(
            available["lower_bound_kg"]
        ) & available["actual_weight_kg"].le(available["upper_bound_kg"])
        widths = available["upper_bound_kg"] - available["lower_bound_kg"]
        rows.append(
            {
                "model": str(model),
                "interval_prediction_count": len(available),
                "missing_interval_count": len(group) - len(available),
                "empirical_coverage_rate": (
                    float(covered.mean()) if len(available) else None
                ),
                "average_interval_width_kg": (
                    float(widths.mean()) if len(available) else None
                ),
            }
        )
    return pd.DataFrame(rows, columns=columns)
