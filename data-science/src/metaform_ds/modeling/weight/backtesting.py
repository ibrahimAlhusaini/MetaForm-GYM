"""Expanding-window evaluation with strict temporal label availability."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.pipeline import (
    build_weight_regression_pipeline,
    model_input,
)

PREDICTION_COLUMNS = [
    "anonymous_user_id",
    "prediction_date",
    "target_date",
    "actual_weight_kg",
    "predicted_weight_kg",
    "baseline_last_value_kg",
    "baseline_trend_kg",
    "fold_id",
    "training_row_count",
    "training_max_prediction_date",
    "training_max_target_date",
]


@dataclass(frozen=True, slots=True)
class BacktestResult:
    status: str
    predictions: pd.DataFrame
    folds: pd.DataFrame
    reasons: tuple[str, ...]


def expanding_window_backtest(
    examples: pd.DataFrame, config: WeightModelConfig
) -> BacktestResult:
    """Fit at each UTC origin using only labels observed strictly before it."""
    if examples.empty:
        return BacktestResult(
            "INSUFFICIENT_DATA",
            pd.DataFrame(columns=PREDICTION_COLUMNS),
            pd.DataFrame(),
            ("No eligible prediction examples were constructed.",),
        )
    ordered = examples.sort_values(
        ["prediction_date", "anonymous_user_id", "target_date"], kind="stable"
    ).reset_index(drop=True)
    prediction_rows: list[pd.DataFrame] = []
    fold_rows: list[dict[str, object]] = []
    skipped_origins = 0
    fold_number = 0
    for origin in ordered["prediction_date"].drop_duplicates().sort_values():
        prediction_date = pd.Timestamp(origin)
        training = ordered.loc[
            ordered["prediction_date"].lt(prediction_date)
            & ordered["target_date"].lt(prediction_date)
        ]
        validation = ordered.loc[ordered["prediction_date"].eq(prediction_date)]
        if len(training) < config.minimum_training_rows:
            skipped_origins += 1
            continue
        fold_number += 1
        pipeline = build_weight_regression_pipeline()
        training_features = model_input(training)
        validation_features = model_input(validation)
        pipeline.fit(training_features, training["actual_weight_kg"].astype(float))
        output = validation.loc[
            :,
            [
                "anonymous_user_id",
                "prediction_date",
                "target_date",
                "actual_weight_kg",
                "baseline_last_value_kg",
                "baseline_trend_kg",
            ],
        ].copy()
        output["predicted_weight_kg"] = pipeline.predict(validation_features)
        output["fold_id"] = f"fold_{fold_number:03d}"
        output["training_row_count"] = len(training)
        output["training_max_prediction_date"] = training["prediction_date"].max()
        output["training_max_target_date"] = training["target_date"].max()
        prediction_rows.append(output.reindex(columns=PREDICTION_COLUMNS))
        fold_rows.append(
            {
                "fold_id": f"fold_{fold_number:03d}",
                "prediction_date": prediction_date,
                "training_row_count": len(training),
                "validation_row_count": len(validation),
                "training_max_prediction_date": training["prediction_date"].max(),
                "training_max_target_date": training["target_date"].max(),
            }
        )
    predictions = (
        pd.concat(prediction_rows, ignore_index=True)
        if prediction_rows
        else pd.DataFrame(columns=PREDICTION_COLUMNS)
    )
    folds = pd.DataFrame(fold_rows)
    if predictions.empty:
        reason = (
            f"No origin had the required {config.minimum_training_rows} "
            "temporally available training rows."
        )
        return BacktestResult("INSUFFICIENT_DATA", predictions, folds, (reason,))
    reasons = (
        (f"Skipped {skipped_origins} early origins before training eligibility.",)
        if skipped_origins
        else ()
    )
    return BacktestResult("COMPLETE", predictions, folds, reasons)
