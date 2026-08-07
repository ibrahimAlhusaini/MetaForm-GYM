from __future__ import annotations

from dataclasses import asdict

import pandas as pd

from metaform_ds.modeling.weight import WeightModelConfig
from metaform_ds.modeling.weight.backtesting import expanding_window_backtest
from metaform_ds.modeling.weight.diagnostics import error_analysis
from metaform_ds.modeling.weight.segments import add_prediction_segments
from metaform_ds.modeling.weight.selection import select_preferred_method
from metaform_ds.modeling.weight.sensitivity import sensitivity_analysis
from metaform_ds.modeling.weight.targets import build_weight_prediction_examples
from metaform_ds.utils.synthetic import generate_synthetic_datasets


def _comparison(linear: float, ridge: float, count: int = 20) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "model": ["Recent Trend Baseline", "Linear Regression", "Ridge Regression"],
            "mae_kg": [1.0, linear, ridge],
            "prediction_count": [count, count, count],
        }
    )


def _stability(linear_cv: float, ridge_cv: float) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "model": ["Linear Regression", "Ridge Regression"],
            "fold_mae_cv": [linear_cv, ridge_cv],
        }
    )


def test_model_selection_requires_gain_count_and_stability() -> None:
    config = WeightModelConfig()
    preferred, state, _ = select_preferred_method(
        _comparison(1.2, 1.1), _stability(0.2, 0.2), data_origin="REAL", config=config
    )
    assert preferred == "Recent Trend Baseline" and state == "BASELINE_PREFERRED"
    preferred, state, _ = select_preferred_method(
        _comparison(0.8, 0.9), _stability(0.2, 0.2), data_origin="REAL", config=config
    )
    assert preferred == "Linear Regression" and state == "ML_CANDIDATE_PROMISING"
    preferred, _, _ = select_preferred_method(
        _comparison(0.8, 0.9, count=3),
        _stability(0.2, 0.2),
        data_origin="REAL",
        config=config,
    )
    assert preferred == "Recent Trend Baseline"
    preferred, _, _ = select_preferred_method(
        _comparison(0.8, 0.9), _stability(2.0, 2.0), data_origin="REAL", config=config
    )
    assert preferred == "Recent Trend Baseline"


def test_error_analysis_values_sorting_and_privacy() -> None:
    examples = build_weight_prediction_examples(
        generate_synthetic_datasets().body_weight
    ).examples
    predictions = expanding_window_backtest(examples, WeightModelConfig()).predictions
    segmented = add_prediction_segments(predictions, WeightModelConfig())
    errors = error_analysis(segmented, WeightModelConfig())
    first = errors.iloc[0]
    assert first["absolute_error_kg"] == abs(first["signed_error_kg"])
    assert bool(first["over_prediction"]) != bool(first["under_prediction"])
    assert errors["absolute_error_kg"].is_monotonic_decreasing
    assert not {"user_id", "email", "full_name"}.intersection(errors.columns)


def test_sensitivity_changes_eligibility_without_mutating_defaults() -> None:
    config = WeightModelConfig()
    before = asdict(config)
    result = sensitivity_analysis(generate_synthetic_datasets().body_weight, config)
    counts = result.groupby("minimum_prior_measurements")["eligible_examples"].max()
    assert counts.loc[5] > counts.loc[10]
    assert set(result["target_tolerance_days"]) == {1, 2}
    assert asdict(config) == before
    assert WeightModelConfig().minimum_prior_measurements == 5
    assert WeightModelConfig().target_tolerance_days == 2
