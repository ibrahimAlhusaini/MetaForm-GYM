from __future__ import annotations

import pandas as pd

from metaform_ds.modeling.weight import (
    WeightModelConfig,
    evaluate_weight_model,
    render_weight_evaluation_report,
)
from metaform_ds.modeling.weight.metrics import (
    best_model_name,
    metric_comparison,
    regression_metrics,
)
from metaform_ds.utils.synthetic import generate_synthetic_datasets


def test_mae_and_rmse_are_correct() -> None:
    metrics = regression_metrics(pd.Series([1.0, 3.0]), pd.Series([2.0, 1.0]))
    assert metrics.mae_kg == 1.5
    assert metrics.rmse_kg == (2.5**0.5)


def test_r2_is_safe_for_small_and_degenerate_samples() -> None:
    one = regression_metrics(pd.Series([2.0]), pd.Series([2.0]))
    constant = regression_metrics(pd.Series([2.0, 2.0]), pd.Series([2.0, 2.0]))
    assert one.r2 is None
    assert constant.r2 is None


def test_empty_metrics_and_comparison_are_safe() -> None:
    metrics = regression_metrics(pd.Series(dtype=float), pd.Series(dtype=float))
    assert metrics.prediction_count == 0
    assert metrics.mae_kg is None
    assert metric_comparison(pd.DataFrame()).empty


def test_model_comparison_identifies_best_mae() -> None:
    predictions = pd.DataFrame(
        {
            "actual_weight_kg": [80.0, 81.0],
            "baseline_last_value_kg": [80.0, 80.0],
            "baseline_trend_kg": [79.0, 79.0],
            "predicted_weight_kg": [80.1, 81.1],
        }
    )
    comparison = metric_comparison(predictions)
    assert best_model_name(comparison) == "Linear Regression"


def test_synthetic_evaluation_is_deterministic_and_preserves_origin() -> None:
    data = generate_synthetic_datasets(42).body_weight
    first = evaluate_weight_model(data, data_origin="SYNTHETIC")
    second = evaluate_weight_model(data, data_origin="SYNTHETIC")
    pd.testing.assert_frame_equal(first.predictions, second.predictions)
    pd.testing.assert_frame_equal(first.comparison, second.comparison)
    assert first.data_origin == "SYNTHETIC"


def test_synthetic_data_cannot_be_labeled_real() -> None:
    data = generate_synthetic_datasets().body_weight
    try:
        evaluate_weight_model(data, data_origin="REAL")
    except ValueError as error:
        assert "cannot be labeled" in str(error)
    else:
        raise AssertionError("Synthetic origin guard did not fail")


def test_prediction_and_report_privacy_boundaries() -> None:
    result = evaluate_weight_model(
        generate_synthetic_datasets().body_weight, data_origin="SYNTHETIC"
    )
    forbidden = {"user_id", "session_id", "source_id", "email", "full_name"}
    assert not forbidden.intersection(result.predictions.columns)
    assert set(result.predictions["anonymous_user_id"]) == {"synthetic_user_001"}
    report = render_weight_evaluation_report(result)
    assert "synthetic_user_001" not in report


def test_report_includes_origin_baselines_horizon_and_limitations() -> None:
    config = WeightModelConfig()
    result = evaluate_weight_model(
        generate_synthetic_datasets().body_weight,
        data_origin="SYNTHETIC",
        config=config,
    )
    report = render_weight_evaluation_report(result)
    assert "Data origin: SYNTHETIC" in report
    assert "Last Value Baseline" in report
    assert "Recent Trend Baseline" in report
    assert "Forecast horizon: 7 days" in report
    assert "limitations" in report.lower()
    assert "Do not integrate automatically" in report


def test_insufficient_evaluation_has_no_fabricated_metrics() -> None:
    empty = pd.DataFrame()
    result = evaluate_weight_model(empty, data_origin="REAL")
    assert result.status == "INSUFFICIENT_DATA"
    assert result.comparison.empty
    assert result.improvement_vs_best_baseline_percent is None
