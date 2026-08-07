"""Temporal stability, abstention, and prediction error diagnostics."""

from __future__ import annotations

import pandas as pd

from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.metrics import (
    MODEL_PREDICTION_COLUMNS,
    regression_metrics,
)


def fold_metrics(predictions: pd.DataFrame) -> pd.DataFrame:
    columns = [
        "fold_id",
        "prediction_date",
        "model",
        "prediction_count",
        "mae_kg",
        "rmse_kg",
        "r2",
    ]
    if predictions.empty:
        return pd.DataFrame(columns=columns)
    rows: list[dict[str, object]] = []
    for fold_id, group in predictions.groupby("fold_id", sort=True):
        for model, prediction_column in MODEL_PREDICTION_COLUMNS.items():
            metric = regression_metrics(
                group["actual_weight_kg"], group[prediction_column]
            )
            rows.append(
                {
                    "fold_id": str(fold_id),
                    "prediction_date": group["prediction_date"].min(),
                    "model": model,
                    "prediction_count": metric.prediction_count,
                    "mae_kg": metric.mae_kg,
                    "rmse_kg": metric.rmse_kg,
                    "r2": metric.r2,
                }
            )
    return pd.DataFrame(rows, columns=columns)


def stability_summary(folds: pd.DataFrame) -> pd.DataFrame:
    columns = [
        "model",
        "fold_count",
        "prediction_count",
        "fold_mae_mean",
        "fold_mae_std",
        "best_fold_mae",
        "worst_fold_mae",
        "fold_mae_cv",
    ]
    if folds.empty:
        return pd.DataFrame(columns=columns)
    rows: list[dict[str, object]] = []
    for model, group in folds.groupby("model", sort=True):
        maes = pd.to_numeric(group["mae_kg"], errors="coerce").dropna()
        mean = float(maes.mean()) if len(maes) else None
        std = float(maes.std(ddof=0)) if len(maes) else None
        cv = std / mean if mean not in (None, 0.0) and std is not None else None
        rows.append(
            {
                "model": str(model),
                "fold_count": len(maes),
                "prediction_count": int(group["prediction_count"].sum()),
                "fold_mae_mean": mean,
                "fold_mae_std": std,
                "best_fold_mae": float(maes.min()) if len(maes) else None,
                "worst_fold_mae": float(maes.max()) if len(maes) else None,
                "fold_mae_cv": cv,
            }
        )
    return pd.DataFrame(rows, columns=columns)


def temporal_period_metrics(predictions: pd.DataFrame) -> pd.DataFrame:
    if predictions.empty:
        return pd.DataFrame(
            columns=["period", "model", "prediction_count", "mae_kg", "rmse_kg", "r2"]
        )
    result = predictions.copy()
    origins = sorted(result["prediction_date"].drop_duplicates())
    labels = ["EARLY", "MIDDLE", "LATE"]
    period_map = {
        origin: labels[min(index * 3 // len(origins), 2)]
        for index, origin in enumerate(origins)
    }
    result["period"] = result["prediction_date"].map(period_map)
    rows: list[dict[str, object]] = []
    for period, group in result.groupby("period", sort=False):
        for model, column in MODEL_PREDICTION_COLUMNS.items():
            metric = regression_metrics(group["actual_weight_kg"], group[column])
            rows.append(
                {
                    "period": str(period),
                    "model": model,
                    "prediction_count": metric.prediction_count,
                    "mae_kg": metric.mae_kg,
                    "rmse_kg": metric.rmse_kg,
                    "r2": metric.r2,
                }
            )
    return pd.DataFrame(rows)


def reliability_metadata(
    predictions: pd.DataFrame,
    intervals: pd.DataFrame,
    *,
    model_name: str,
    data_origin: str,
    config: WeightModelConfig,
) -> pd.DataFrame:
    selected_intervals = intervals.loc[intervals["model"].eq(model_name)].copy()
    base = predictions.merge(
        selected_intervals[
            [
                "anonymous_user_id",
                "prediction_date",
                "interval_available",
                "residual_sample_count",
                "interval_abstention_reason",
            ]
        ],
        on=["anonymous_user_id", "prediction_date"],
        how="left",
    )
    base["model_name"] = model_name
    base["model_version"] = config.model_version
    base["forecast_horizon_days"] = config.forecast_horizon_days
    base["interval_coverage_target"] = config.interval_coverage
    base["data_origin"] = data_origin
    sparse = (
        base["days_since_previous_measurement"].gt(config.maximum_recent_gap_days)
        if "days_since_previous_measurement" in base
        else base["recent_measurement_cadence_days"].gt(config.maximum_recent_gap_days)
    )
    base["point_eligible"] = ~sparse
    base["abstention_reason"] = sparse.map({True: "EXCESSIVE_RECENT_GAP", False: None})
    return base[
        [
            "anonymous_user_id",
            "model_name",
            "model_version",
            "prediction_date",
            "forecast_horizon_days",
            "prior_measurement_count",
            "recent_measurement_cadence_days",
            "point_eligible",
            "interval_available",
            "interval_coverage_target",
            "residual_sample_count",
            "abstention_reason",
            "interval_abstention_reason",
            "data_origin",
        ]
    ]


def error_analysis(
    predictions: pd.DataFrame, config: WeightModelConfig
) -> pd.DataFrame:
    columns = [
        "anonymous_user_id",
        "model",
        "prediction_date",
        "actual_weight_kg",
        "predicted_weight_kg",
        "signed_error_kg",
        "absolute_error_kg",
        "over_prediction",
        "under_prediction",
        "large_error",
        "cadence_bucket",
        "history_bucket",
    ]
    if predictions.empty:
        return pd.DataFrame(columns=columns)
    rows: list[pd.DataFrame] = []
    for model, prediction_column in MODEL_PREDICTION_COLUMNS.items():
        part = predictions[
            [
                "anonymous_user_id",
                "prediction_date",
                "actual_weight_kg",
                "cadence_bucket",
                "history_bucket",
            ]
        ].copy()
        part["model"] = model
        part["predicted_weight_kg"] = predictions[prediction_column]
        part["signed_error_kg"] = part["predicted_weight_kg"] - part["actual_weight_kg"]
        part["absolute_error_kg"] = part["signed_error_kg"].abs()
        part["over_prediction"] = part["signed_error_kg"].gt(0)
        part["under_prediction"] = part["signed_error_kg"].lt(0)
        part["large_error"] = part["absolute_error_kg"].gt(
            config.large_error_threshold_kg
        )
        rows.append(part.reindex(columns=columns))
    return (
        pd.concat(rows, ignore_index=True)
        .sort_values("absolute_error_kg", ascending=False, kind="stable")
        .reset_index(drop=True)
    )
