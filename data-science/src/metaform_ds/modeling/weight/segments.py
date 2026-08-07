"""Past-only cadence and history segmentation diagnostics."""

from __future__ import annotations

import math

import pandas as pd

from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.metrics import (
    MODEL_PREDICTION_COLUMNS,
    regression_metrics,
)


def cadence_bucket(value: float | None, config: WeightModelConfig) -> str:
    if value is None or not math.isfinite(value):
        return "UNKNOWN"
    if value <= config.cadence_high_max_days:
        return "HIGH_FREQUENCY"
    if value <= config.cadence_moderate_max_days:
        return "MODERATE_FREQUENCY"
    return "LOW_FREQUENCY"


def history_bucket(prior_count: int, config: WeightModelConfig) -> str:
    if prior_count < config.history_medium_minimum:
        return "5_TO_7"
    if prior_count < config.history_long_minimum:
        return "8_TO_11"
    return "12_PLUS"


def add_prediction_segments(
    predictions: pd.DataFrame, config: WeightModelConfig
) -> pd.DataFrame:
    result = predictions.copy(deep=True)
    if result.empty:
        result["cadence_bucket"] = pd.Series(dtype="string")
        result["history_bucket"] = pd.Series(dtype="string")
        return result
    result["cadence_bucket"] = result["recent_measurement_cadence_days"].map(
        lambda value: cadence_bucket(None if pd.isna(value) else float(value), config)
    )
    result["history_bucket"] = result["prior_measurement_count"].map(
        lambda value: history_bucket(int(value), config)
    )
    return result


def segment_metrics(
    predictions: pd.DataFrame,
    *,
    segment_column: str,
    config: WeightModelConfig,
) -> pd.DataFrame:
    columns = [
        segment_column,
        "model",
        "prediction_count",
        "mae_kg",
        "rmse_kg",
        "r2",
        "best_in_segment",
        "insufficient_sample",
    ]
    if predictions.empty:
        return pd.DataFrame(columns=columns)
    rows: list[dict[str, object]] = []
    for segment, group in predictions.groupby(segment_column, sort=True):
        segment_rows: list[dict[str, object]] = []
        for model, prediction_column in MODEL_PREDICTION_COLUMNS.items():
            metrics = regression_metrics(
                group["actual_weight_kg"], group[prediction_column]
            )
            segment_rows.append(
                {
                    segment_column: str(segment),
                    "model": model,
                    "prediction_count": metrics.prediction_count,
                    "mae_kg": metrics.mae_kg,
                    "rmse_kg": metrics.rmse_kg,
                    "r2": metrics.r2,
                    "best_in_segment": False,
                    "insufficient_sample": (
                        metrics.prediction_count < config.minimum_segment_predictions
                    ),
                }
            )
        valid = [row for row in segment_rows if row["mae_kg"] is not None]
        if valid:
            min(valid, key=lambda row: float(str(row["mae_kg"])))["best_in_segment"] = (
                True
            )
        rows.extend(segment_rows)
    return pd.DataFrame(rows, columns=columns)
