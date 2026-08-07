from __future__ import annotations

import pandas as pd

from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.diagnostics import reliability_metadata
from metaform_ds.modeling.weight.uncertainty import (
    empirical_error_quantile,
    empirical_intervals,
    interval_diagnostics,
)


def _predictions() -> pd.DataFrame:
    dates = pd.date_range("2026-01-01", periods=6, freq="10D", tz="UTC")
    return pd.DataFrame(
        {
            "anonymous_user_id": "anonymous-user",
            "prediction_date": dates,
            "target_date": dates + pd.Timedelta(days=7),
            "actual_weight_kg": [80.0, 80.5, 81.0, 81.5, 82.0, 82.5],
            "baseline_last_value_kg": [79.0, 80.0, 80.0, 81.0, 81.0, 82.0],
            "baseline_trend_kg": [79.5, 80.0, 80.5, 81.0, 81.5, 82.0],
            "predicted_weight_kg": [80.5, 80.0, 81.5, 81.0, 82.5, 82.0],
            "ridge_predicted_weight_kg": [80.2, 80.3, 81.2, 81.3, 82.2, 82.3],
            "prior_measurement_count": [5, 6, 7, 8, 9, 10],
            "recent_measurement_cadence_days": [4.0] * 6,
            "days_since_previous_measurement": [4.0] * 6,
        }
    )


def test_empirical_quantile_and_past_residual_requirement() -> None:
    assert empirical_error_quantile(pd.Series([0.1, 0.2, 0.9]), 0.8) == 0.9
    config = WeightModelConfig(minimum_interval_residuals=2)
    intervals = empirical_intervals(_predictions(), config)
    linear = intervals.loc[intervals["model"].eq("Linear Regression")]
    assert not bool(linear.iloc[0]["interval_available"])
    assert bool(linear.iloc[2]["interval_available"])
    assert linear.iloc[2]["residual_sample_count"] == 2
    assert linear.iloc[2]["lower_bound_kg"] <= linear.iloc[2]["point_prediction_kg"]
    assert linear.iloc[2]["point_prediction_kg"] <= linear.iloc[2]["upper_bound_kg"]


def test_future_residual_changes_do_not_change_earlier_intervals() -> None:
    config = WeightModelConfig(minimum_interval_residuals=2)
    original = empirical_intervals(_predictions(), config)
    changed = _predictions()
    changed.loc[5, "actual_weight_kg"] = 999.0
    rebuilt = empirical_intervals(changed, config)
    cutoff = pd.Timestamp("2026-02-10", tz="UTC")
    columns = ["model", "prediction_date", "lower_bound_kg", "upper_bound_kg"]
    pd.testing.assert_frame_equal(
        original.loc[original["prediction_date"].le(cutoff), columns].reset_index(
            drop=True
        ),
        rebuilt.loc[rebuilt["prediction_date"].le(cutoff), columns].reset_index(
            drop=True
        ),
    )


def test_interval_coverage_and_width_are_correct() -> None:
    intervals = pd.DataFrame(
        {
            "model": ["M", "M", "M"],
            "interval_available": [True, True, False],
            "actual_weight_kg": [80.0, 85.0, 90.0],
            "lower_bound_kg": [79.0, 80.0, None],
            "upper_bound_kg": [81.0, 84.0, None],
        }
    )
    result = interval_diagnostics(intervals).iloc[0]
    assert result["empirical_coverage_rate"] == 0.5
    assert result["average_interval_width_kg"] == 3.0
    assert result["missing_interval_count"] == 1


def test_point_and_interval_abstention_are_separate_and_stable() -> None:
    predictions = _predictions()
    predictions.loc[5, "days_since_previous_measurement"] = 20.0
    config = WeightModelConfig(minimum_interval_residuals=2)
    intervals = empirical_intervals(predictions, config)
    metadata = reliability_metadata(
        predictions,
        intervals,
        model_name="Recent Trend Baseline",
        data_origin="SYNTHETIC",
        config=config,
    )
    assert (
        metadata.iloc[0]["interval_abstention_reason"] == "INSUFFICIENT_PAST_RESIDUALS"
    )
    assert bool(metadata.iloc[0]["point_eligible"])
    assert metadata.iloc[-1]["abstention_reason"] == "EXCESSIVE_RECENT_GAP"
    assert not bool(metadata.iloc[-1]["point_eligible"])
    assert metadata.iloc[-1]["model_version"] == "body-weight-v1"
