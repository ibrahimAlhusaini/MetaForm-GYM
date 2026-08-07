"""End-to-end Body-weight Prediction V1 temporal evaluation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import pandas as pd

from metaform_ds.modeling.weight.backtesting import expanding_window_backtest
from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.metrics import metric_comparison, regression_metrics
from metaform_ds.modeling.weight.targets import build_weight_prediction_examples

DataOrigin = Literal["REAL", "SYNTHETIC"]


@dataclass(frozen=True, slots=True)
class WeightEvaluationResult:
    status: str
    data_origin: DataOrigin
    config: WeightModelConfig
    predictions: pd.DataFrame
    comparison: pd.DataFrame
    per_user_metrics: pd.DataFrame
    eligibility_summary: pd.DataFrame
    exclusion_reasons: pd.DataFrame
    folds: pd.DataFrame
    improvement_vs_best_baseline_percent: float | None
    interpretation: str
    reasons: tuple[str, ...]


def _per_user_metrics(predictions: pd.DataFrame) -> pd.DataFrame:
    columns = [
        "anonymous_user_id",
        "model",
        "mae_kg",
        "rmse_kg",
        "r2",
        "prediction_count",
    ]
    if predictions.empty:
        return pd.DataFrame(columns=columns)
    mappings = {
        "Last Value Baseline": "baseline_last_value_kg",
        "Recent Trend Baseline": "baseline_trend_kg",
        "Linear Regression": "predicted_weight_kg",
    }
    rows: list[dict[str, object]] = []
    for anonymous_user_id, user_rows in predictions.groupby(
        "anonymous_user_id", sort=True
    ):
        for model_name, prediction_column in mappings.items():
            metrics = regression_metrics(
                user_rows["actual_weight_kg"], user_rows[prediction_column]
            )
            rows.append(
                {
                    "anonymous_user_id": str(anonymous_user_id),
                    "model": model_name,
                    "mae_kg": metrics.mae_kg,
                    "rmse_kg": metrics.rmse_kg,
                    "r2": metrics.r2,
                    "prediction_count": metrics.prediction_count,
                }
            )
    return pd.DataFrame(rows, columns=columns)


def _interpret(
    comparison: pd.DataFrame, config: WeightModelConfig
) -> tuple[float | None, str]:
    if comparison.empty:
        return None, "Insufficient data; no model performance claim is available."
    indexed = comparison.set_index("model")
    model_mae = indexed.loc["Linear Regression", "mae_kg"]
    baseline_maes = indexed.loc[
        ["Last Value Baseline", "Recent Trend Baseline"], "mae_kg"
    ].dropna()
    if pd.isna(model_mae) or baseline_maes.empty:
        return None, "Insufficient comparable metrics; production use is not justified."
    best_baseline_mae = float(str(baseline_maes.min()))
    model_mae_value = float(str(model_mae))
    if best_baseline_mae == 0:
        improvement = 0.0 if model_mae_value == 0 else float("-inf")
    else:
        improvement = (best_baseline_mae - model_mae_value) / best_baseline_mae * 100
    threshold = config.meaningful_improvement_percent
    if improvement >= threshold:
        message = (
            "Linear Regression shows incremental predictive value on this evaluation, "
            "but production readiness still requires real-data validation."
        )
    elif improvement > -threshold:
        message = (
            "Linear Regression is similar to the best baseline; added model complexity "
            "is not yet justified."
        )
    else:
        message = (
            "Linear Regression underperforms the best baseline and does not justify "
            "production use."
        )
    return improvement, message


def evaluate_weight_model(
    frame: pd.DataFrame,
    *,
    data_origin: DataOrigin,
    config: WeightModelConfig | None = None,
) -> WeightEvaluationResult:
    """Construct labels, backtest, and compare models without persisting a model."""
    settings = config or WeightModelConfig()
    if data_origin == "REAL" and bool(frame.attrs.get("synthetic", False)):
        raise ValueError("Synthetic data cannot be labeled as REAL")
    targets = build_weight_prediction_examples(frame, settings)
    backtest = expanding_window_backtest(targets.examples, settings)
    comparison = metric_comparison(backtest.predictions)
    improvement, interpretation = _interpret(comparison, settings)
    return WeightEvaluationResult(
        status=backtest.status,
        data_origin=data_origin,
        config=settings,
        predictions=backtest.predictions,
        comparison=comparison,
        per_user_metrics=_per_user_metrics(backtest.predictions),
        eligibility_summary=targets.eligibility_summary,
        exclusion_reasons=targets.exclusion_reasons,
        folds=backtest.folds,
        improvement_vs_best_baseline_percent=improvement,
        interpretation=interpretation,
        reasons=backtest.reasons,
    )
