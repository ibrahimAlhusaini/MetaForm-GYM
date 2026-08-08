"""Global expanding-origin evaluation with strict label availability."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from metaform_ds.modeling.strength.config import StrengthModelConfig
from metaform_ds.modeling.strength.pipeline import (
    build_linear_pipeline,
    build_ridge_pipeline,
    model_input,
)


@dataclass(frozen=True, slots=True)
class StrengthBacktestResult:
    status: str
    predictions: pd.DataFrame
    folds: pd.DataFrame
    reasons: tuple[str, ...]


def expanding_window_backtest(
    examples: pd.DataFrame, config: StrengthModelConfig
) -> StrengthBacktestResult:
    if examples.empty:
        return StrengthBacktestResult(
            "INSUFFICIENT_DATA",
            pd.DataFrame(),
            pd.DataFrame(),
            ("No eligible examples.",),
        )
    source_count = (
        examples[["anonymous_user_id", "source_type", "source_key_anonymous"]]
        .drop_duplicates()
        .shape[0]
    )
    if source_count < config.minimum_sources:
        return StrengthBacktestResult(
            "INSUFFICIENT_DATA",
            pd.DataFrame(),
            pd.DataFrame(),
            (
                f"Only {source_count} eligible source histories; "
                f"at least {config.minimum_sources} are required.",
            ),
        )
    ordered = examples.sort_values(
        ["prediction_date", "anonymous_user_id", "source_type", "source_key_anonymous"],
        kind="stable",
    ).reset_index(drop=True)
    outputs: list[pd.DataFrame] = []
    folds: list[dict[str, object]] = []
    for origin in ordered["prediction_date"].drop_duplicates().sort_values():
        timestamp = pd.Timestamp(origin)
        training = ordered.loc[
            ordered["prediction_date"].lt(timestamp)
            & ordered["target_date"].lt(timestamp)
        ]
        validation = ordered.loc[ordered["prediction_date"].eq(timestamp)]
        if len(training) < config.minimum_training_rows:
            continue
        linear = build_linear_pipeline()
        ridge = build_ridge_pipeline(config.ridge_alpha)
        train_x = model_input(training)
        validation_x = model_input(validation)
        target = training["actual_next_max_weight_kg"].astype(float)
        linear.fit(train_x, target)
        ridge.fit(train_x, target)
        output = validation.loc[
            :,
            [
                "anonymous_user_id",
                "source_key_anonymous",
                "source_type",
                "prediction_date",
                "target_date",
                "actual_next_max_weight_kg",
                "current_max_weight_kg",
                "baseline_last_session_kg",
                "baseline_recent_trend_kg",
                "prior_session_count",
                "recent_cadence_days",
            ],
        ].copy()
        output["linear_prediction_kg"] = np.maximum(0.0, linear.predict(validation_x))
        output["ridge_prediction_kg"] = np.maximum(0.0, ridge.predict(validation_x))
        fold_id = f"fold_{len(folds) + 1:03d}"
        output["fold_id"] = fold_id
        output["training_row_count"] = len(training)
        output["training_max_prediction_date"] = training["prediction_date"].max()
        output["training_max_target_date"] = training["target_date"].max()
        outputs.append(output)
        folds.append(
            {
                "fold_id": fold_id,
                "validation_origin": timestamp,
                "training_row_count": len(training),
                "validation_row_count": len(validation),
                "training_max_prediction_date": training["prediction_date"].max(),
                "training_max_target_date": training["target_date"].max(),
            }
        )
    predictions = pd.concat(outputs, ignore_index=True) if outputs else pd.DataFrame()
    fold_frame = pd.DataFrame(folds)
    if predictions.empty or len(fold_frame) < config.minimum_temporal_folds:
        return StrengthBacktestResult(
            "INSUFFICIENT_DATA",
            predictions.iloc[0:0].copy(),
            fold_frame,
            ("Too few temporally valid training folds.",),
        )
    return StrengthBacktestResult("COMPLETE", predictions, fold_frame, ())
