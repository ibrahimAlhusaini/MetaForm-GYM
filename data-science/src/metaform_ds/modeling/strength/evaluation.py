"""End-to-end Strength Progression Modeling V1 evaluation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import pandas as pd

from metaform_ds.modeling.strength.backtesting import expanding_window_backtest
from metaform_ds.modeling.strength.config import StrengthModelConfig
from metaform_ds.modeling.strength.diagnostics import (
    add_segments,
    fold_metrics,
    segment_metrics,
    stability_summary,
)
from metaform_ds.modeling.strength.metrics import best_baseline, metric_comparison
from metaform_ds.modeling.strength.selection import select_preferred_method
from metaform_ds.modeling.strength.targets import build_strength_prediction_examples

DataOrigin = Literal["REAL", "SYNTHETIC"]


@dataclass(frozen=True, slots=True)
class StrengthEvaluationResult:
    status: str
    data_origin: DataOrigin
    config: StrengthModelConfig
    predictions: pd.DataFrame
    comparison: pd.DataFrame
    fold_metrics: pd.DataFrame
    stability: pd.DataFrame
    source_type_metrics: pd.DataFrame
    history_metrics: pd.DataFrame
    cadence_metrics: pd.DataFrame
    eligibility_summary: pd.DataFrame
    exclusion_reasons: pd.DataFrame
    folds: pd.DataFrame
    best_baseline: str | None
    preferred_method: str | None
    recommendation: str
    selection_details: pd.DataFrame


def evaluate_strength_model(
    frame: pd.DataFrame,
    *,
    data_origin: DataOrigin,
    config: StrengthModelConfig | None = None,
) -> StrengthEvaluationResult:
    settings = config or StrengthModelConfig()
    if data_origin == "REAL" and bool(frame.attrs.get("synthetic", False)):
        raise ValueError("Synthetic strength data cannot be labeled as REAL")
    targets = build_strength_prediction_examples(frame, settings)
    backtest = expanding_window_backtest(targets.examples, settings)
    predictions = (
        add_segments(backtest.predictions, settings)
        if not backtest.predictions.empty
        else backtest.predictions
    )
    comparison = metric_comparison(
        predictions, tolerance=settings.direction_tolerance_kg
    )
    folds = fold_metrics(predictions)
    stability = stability_summary(folds)
    preferred, recommendation, details = select_preferred_method(
        comparison, stability, config=settings
    )
    if backtest.status != "COMPLETE":
        preferred, recommendation = None, "INSUFFICIENT_DATA"
    return StrengthEvaluationResult(
        status=backtest.status,
        data_origin=data_origin,
        config=settings,
        predictions=predictions,
        comparison=comparison,
        fold_metrics=folds,
        stability=stability,
        source_type_metrics=segment_metrics(predictions, "source_type", settings),
        history_metrics=segment_metrics(predictions, "history_bucket", settings),
        cadence_metrics=segment_metrics(predictions, "cadence_bucket", settings),
        eligibility_summary=targets.eligibility_summary,
        exclusion_reasons=targets.exclusion_reasons,
        folds=backtest.folds,
        best_baseline=best_baseline(comparison),
        preferred_method=preferred,
        recommendation=recommendation,
        selection_details=details,
    )
