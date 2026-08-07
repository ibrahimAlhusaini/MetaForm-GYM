"""Conservative evaluation-time model selection and recommendation states."""

from __future__ import annotations

from typing import Literal

import pandas as pd

from metaform_ds.modeling.weight.config import WeightModelConfig

RecommendationState = Literal[
    "INSUFFICIENT_REAL_DATA",
    "BASELINE_PREFERRED",
    "ML_CANDIDATE_PROMISING",
    "READY_FOR_INTEGRATION_EVALUATION",
]


def select_preferred_method(
    comparison: pd.DataFrame,
    stability: pd.DataFrame,
    *,
    data_origin: str,
    config: WeightModelConfig,
) -> tuple[str, RecommendationState, pd.DataFrame]:
    columns = [
        "model",
        "mae_improvement_vs_recent_trend_percent",
        "enough_predictions",
        "stable_folds",
        "selected",
    ]
    if comparison.empty:
        return (
            "Recent Trend Baseline",
            "INSUFFICIENT_REAL_DATA",
            pd.DataFrame(columns=columns),
        )
    indexed = comparison.set_index("model")
    baseline_mae = float(str(indexed.loc["Recent Trend Baseline", "mae_kg"]))
    rows: list[dict[str, object]] = []
    qualified: list[tuple[str, float]] = []
    for model in ("Linear Regression", "Ridge Regression"):
        model_row = indexed.loc[model]
        model_mae = float(str(model_row["mae_kg"]))
        improvement = (
            ((baseline_mae - model_mae) / baseline_mae * 100) if baseline_mae else 0.0
        )
        enough = (
            int(float(str(model_row["prediction_count"])))
            >= config.minimum_selection_predictions
        )
        stability_row = stability.loc[stability["model"].eq(model)]
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
                "model": model,
                "mae_improvement_vs_recent_trend_percent": improvement,
                "enough_predictions": enough,
                "stable_folds": stable,
                "selected": selected,
            }
        )
        if selected:
            qualified.append((model, model_mae))
    preferred = (
        min(qualified, key=lambda item: item[1])[0]
        if qualified
        else "Recent Trend Baseline"
    )
    if data_origin != "REAL":
        state: RecommendationState = "INSUFFICIENT_REAL_DATA"
    elif preferred == "Recent Trend Baseline":
        state = "BASELINE_PREFERRED"
    else:
        state = "ML_CANDIDATE_PROMISING"
    return preferred, state, pd.DataFrame(rows, columns=columns)
