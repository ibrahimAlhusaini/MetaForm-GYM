from __future__ import annotations

import numpy as np
import pandas as pd

from metaform_ds.modeling.weight import WeightModelConfig
from metaform_ds.modeling.weight.backtesting import expanding_window_backtest
from metaform_ds.modeling.weight.diagnostics import fold_metrics, stability_summary
from metaform_ds.modeling.weight.pipeline import (
    build_weight_ridge_pipeline,
    model_input,
)
from metaform_ds.modeling.weight.segments import (
    add_prediction_segments,
    cadence_bucket,
    history_bucket,
    segment_metrics,
)
from metaform_ds.modeling.weight.targets import (
    MODEL_FEATURE_COLUMNS,
    build_weight_prediction_examples,
)
from metaform_ds.utils.synthetic import generate_synthetic_datasets


def _examples() -> pd.DataFrame:
    return build_weight_prediction_examples(
        generate_synthetic_datasets(91).body_weight
    ).examples


def test_ridge_pipeline_uses_same_features_and_unknown_categories() -> None:
    examples = _examples()
    pipeline = build_weight_ridge_pipeline(1.0)
    source = examples.copy(deep=True)
    pipeline.fit(model_input(examples.iloc[:8]), examples.iloc[:8]["actual_weight_kg"])
    unknown = examples.iloc[8:9].copy()
    unknown["fitness_goal"] = "UNKNOWN_GOAL"
    unknown["activity_level"] = "UNKNOWN_ACTIVITY"
    prediction = pipeline.predict(model_input(unknown))
    assert list(model_input(unknown).columns) == MODEL_FEATURE_COLUMNS
    assert np.isfinite(float(prediction[0]))
    pd.testing.assert_frame_equal(examples, source)


def test_fold_robustness_is_chronological_and_deterministic() -> None:
    first = expanding_window_backtest(_examples(), WeightModelConfig())
    second = expanding_window_backtest(_examples(), WeightModelConfig())
    pd.testing.assert_frame_equal(
        fold_metrics(first.predictions), fold_metrics(second.predictions)
    )
    assert (
        first.predictions["training_max_target_date"]
        < first.predictions["prediction_date"]
    ).all()
    assert first.folds["training_row_count"].is_monotonic_increasing


def test_stability_summary_values_and_empty_behavior() -> None:
    folds = pd.DataFrame(
        {"model": ["M", "M"], "mae_kg": [1.0, 3.0], "prediction_count": [2, 2]}
    )
    summary = stability_summary(folds).iloc[0]
    assert summary["fold_mae_mean"] == 2.0
    assert summary["fold_mae_std"] == 1.0
    assert summary["best_fold_mae"] == 1.0
    assert summary["worst_fold_mae"] == 3.0
    assert stability_summary(pd.DataFrame()).empty


def test_cadence_and_history_bucket_boundaries() -> None:
    config = WeightModelConfig()
    assert cadence_bucket(4.0, config) == "HIGH_FREQUENCY"
    assert cadence_bucket(4.01, config) == "MODERATE_FREQUENCY"
    assert cadence_bucket(7.0, config) == "MODERATE_FREQUENCY"
    assert cadence_bucket(7.01, config) == "LOW_FREQUENCY"
    assert cadence_bucket(None, config) == "UNKNOWN"
    assert history_bucket(5, config) == "5_TO_7"
    assert history_bucket(7, config) == "5_TO_7"
    assert history_bucket(8, config) == "8_TO_11"
    assert history_bucket(11, config) == "8_TO_11"
    assert history_bucket(12, config) == "12_PLUS"


def test_cadence_uses_only_past_timestamps_and_same_dates_are_stable() -> None:
    frame = generate_synthetic_datasets(22).body_weight
    original = build_weight_prediction_examples(frame).examples
    changed = frame.copy()
    changed.loc[changed.index[-1], "measured_at"] += pd.Timedelta(days=1)
    rebuilt = build_weight_prediction_examples(changed).examples
    cutoff = original["prediction_date"].iloc[-2]
    left = original.loc[
        original["prediction_date"].le(cutoff), "recent_measurement_cadence_days"
    ]
    right = rebuilt.loc[
        rebuilt["prediction_date"].le(cutoff), "recent_measurement_cadence_days"
    ]
    pd.testing.assert_series_equal(
        left.reset_index(drop=True), right.reset_index(drop=True)
    )
    duplicate = frame.copy()
    duplicate.loc[1, "measured_at"] = duplicate.loc[0, "measured_at"]
    one = build_weight_prediction_examples(duplicate).examples
    two = build_weight_prediction_examples(duplicate).examples
    pd.testing.assert_frame_equal(one, two)


def test_segment_metrics_and_empty_cadence_are_safe() -> None:
    backtest = expanding_window_backtest(_examples(), WeightModelConfig())
    segmented = add_prediction_segments(backtest.predictions, WeightModelConfig())
    metrics = segment_metrics(
        segmented, segment_column="cadence_bucket", config=WeightModelConfig()
    )
    assert set(metrics["model"]) == {
        "Last Value Baseline",
        "Recent Trend Baseline",
        "Linear Regression",
        "Ridge Regression",
    }
    assert add_prediction_segments(pd.DataFrame(), WeightModelConfig()).empty
