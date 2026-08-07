"""Orchestration for robustness, calibration, abstention, and sensitivity."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from metaform_ds.modeling.weight.backtesting import expanding_window_backtest
from metaform_ds.modeling.weight.calendar import calendar_cutoff_evaluation
from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.diagnostics import (
    error_analysis,
    fold_metrics,
    reliability_metadata,
    stability_summary,
    temporal_period_metrics,
)
from metaform_ds.modeling.weight.evaluation import DataOrigin
from metaform_ds.modeling.weight.metrics import metric_comparison
from metaform_ds.modeling.weight.segments import (
    add_prediction_segments,
    segment_metrics,
)
from metaform_ds.modeling.weight.selection import (
    RecommendationState,
    select_preferred_method,
)
from metaform_ds.modeling.weight.sensitivity import sensitivity_analysis
from metaform_ds.modeling.weight.targets import build_weight_prediction_examples
from metaform_ds.modeling.weight.uncertainty import (
    empirical_intervals,
    interval_diagnostics,
)


@dataclass(frozen=True, slots=True)
class WeightRobustnessResult:
    status: str
    data_origin: DataOrigin
    config: WeightModelConfig
    predictions: pd.DataFrame
    comparison: pd.DataFrame
    fold_metrics: pd.DataFrame
    stability: pd.DataFrame
    temporal_periods: pd.DataFrame
    calendar_cutoffs: pd.DataFrame
    cadence_metrics: pd.DataFrame
    history_metrics: pd.DataFrame
    intervals: pd.DataFrame
    interval_diagnostics: pd.DataFrame
    reliability_metadata: pd.DataFrame
    errors: pd.DataFrame
    sensitivity: pd.DataFrame
    eligibility_summary: pd.DataFrame
    exclusion_reasons: pd.DataFrame
    selection_diagnostics: pd.DataFrame
    preferred_method: str
    recommendation_state: RecommendationState
    reasons: tuple[str, ...]


def evaluate_weight_robustness(
    frame: pd.DataFrame,
    *,
    data_origin: DataOrigin,
    config: WeightModelConfig | None = None,
    calendar_cutoffs: list[pd.Timestamp] | None = None,
) -> WeightRobustnessResult:
    settings = config or WeightModelConfig()
    if data_origin == "REAL" and bool(frame.attrs.get("synthetic", False)):
        raise ValueError("Synthetic data cannot be labeled as REAL")
    targets = build_weight_prediction_examples(frame, settings)
    backtest = expanding_window_backtest(targets.examples, settings)
    predictions = add_prediction_segments(backtest.predictions, settings)
    comparison = metric_comparison(predictions)
    folds = fold_metrics(predictions)
    stability = stability_summary(folds)
    preferred, state, selection = select_preferred_method(
        comparison, stability, data_origin=data_origin, config=settings
    )
    intervals = empirical_intervals(predictions, settings)
    cutoffs = calendar_cutoffs or []
    return WeightRobustnessResult(
        status=backtest.status,
        data_origin=data_origin,
        config=settings,
        predictions=predictions,
        comparison=comparison,
        fold_metrics=folds,
        stability=stability,
        temporal_periods=temporal_period_metrics(predictions),
        calendar_cutoffs=calendar_cutoff_evaluation(frame, cutoffs, settings),
        cadence_metrics=segment_metrics(
            predictions, segment_column="cadence_bucket", config=settings
        ),
        history_metrics=segment_metrics(
            predictions, segment_column="history_bucket", config=settings
        ),
        intervals=intervals,
        interval_diagnostics=interval_diagnostics(intervals),
        reliability_metadata=reliability_metadata(
            predictions,
            intervals,
            model_name=preferred,
            data_origin=data_origin,
            config=settings,
        ),
        errors=error_analysis(predictions, settings),
        sensitivity=sensitivity_analysis(frame, settings),
        eligibility_summary=targets.eligibility_summary,
        exclusion_reasons=targets.exclusion_reasons,
        selection_diagnostics=selection,
        preferred_method=preferred,
        recommendation_state=state,
        reasons=backtest.reasons,
    )
