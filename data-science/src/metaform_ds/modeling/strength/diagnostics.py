"""Temporal and safe-segment strength diagnostics."""

from __future__ import annotations

import pandas as pd

from metaform_ds.modeling.strength.config import StrengthModelConfig
from metaform_ds.modeling.strength.metrics import PREDICTION_COLUMNS, regression_metrics


def add_segments(frame: pd.DataFrame, config: StrengthModelConfig) -> pd.DataFrame:
    result = frame.copy()
    result["history_bucket"] = pd.cut(
        result["prior_session_count"],
        bins=[3, 6, 10, float("inf")],
        labels=["4-6", "7-10", "11+"],
        right=True,
    ).astype("string")
    result["cadence_bucket"] = (
        pd.cut(
            result["recent_cadence_days"],
            bins=[
                -float("inf"),
                config.cadence_frequent_max_days,
                config.cadence_moderate_max_days,
                float("inf"),
            ],
            labels=["FREQUENT", "MODERATE", "SPARSE"],
            right=True,
        )
        .astype("string")
        .fillna("UNKNOWN")
    )
    return result


def segment_metrics(
    predictions: pd.DataFrame, segment: str, config: StrengthModelConfig
) -> pd.DataFrame:
    columns = [
        segment,
        "method",
        "mae_kg",
        "rmse_kg",
        "r2",
        "prediction_count",
        "sufficient",
    ]
    if predictions.empty:
        return pd.DataFrame(columns=columns)
    rows: list[dict[str, object]] = []
    for value, group in predictions.groupby(segment, observed=True, dropna=False):
        for method, column in PREDICTION_COLUMNS.items():
            metric = regression_metrics(
                group["actual_next_max_weight_kg"], group[column]
            )
            rows.append(
                {
                    segment: str(value),
                    "method": method,
                    "mae_kg": metric.mae_kg,
                    "rmse_kg": metric.rmse_kg,
                    "r2": metric.r2,
                    "prediction_count": metric.prediction_count,
                    "sufficient": metric.prediction_count
                    >= config.minimum_segment_predictions,
                }
            )
    return pd.DataFrame(rows, columns=columns)


def fold_metrics(predictions: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    for fold, group in predictions.groupby("fold_id", sort=True):
        for method, column in PREDICTION_COLUMNS.items():
            metric = regression_metrics(
                group["actual_next_max_weight_kg"], group[column]
            )
            rows.append(
                {
                    "fold_id": str(fold),
                    "method": method,
                    "mae_kg": metric.mae_kg,
                    "prediction_count": metric.prediction_count,
                }
            )
    return pd.DataFrame(rows)


def stability_summary(folds: pd.DataFrame) -> pd.DataFrame:
    if folds.empty:
        return pd.DataFrame(
            columns=[
                "method",
                "fold_count",
                "fold_mae_mean",
                "fold_mae_std",
                "fold_mae_cv",
            ]
        )
    rows: list[dict[str, object]] = []
    for method, group in folds.groupby("method", sort=True):
        values = pd.to_numeric(group["mae_kg"], errors="coerce").dropna()
        mean = float(values.mean()) if len(values) else None
        std = float(values.std(ddof=0)) if len(values) else None
        rows.append(
            {
                "method": str(method),
                "fold_count": len(values),
                "fold_mae_mean": mean,
                "fold_mae_std": std,
                "fold_mae_cv": std / mean
                if mean not in (None, 0.0) and std is not None
                else None,
            }
        )
    return pd.DataFrame(rows)
