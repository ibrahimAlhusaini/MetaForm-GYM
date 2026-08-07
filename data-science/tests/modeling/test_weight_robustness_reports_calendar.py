from __future__ import annotations

import pandas as pd

from metaform_ds.modeling.weight import (
    WeightModelConfig,
    evaluate_weight_robustness,
    render_robustness_report,
)
from metaform_ds.modeling.weight.calendar import calendar_cutoff_evaluation
from metaform_ds.utils.synthetic import generate_synthetic_datasets


def test_calendar_cutoffs_are_deterministic_and_small_cutoff_is_safe() -> None:
    data = generate_synthetic_datasets(33).body_weight
    cutoffs = [
        pd.Timestamp("2026-03-01", tz="UTC"),
        pd.Timestamp("2030-01-01", tz="UTC"),
    ]
    first = calendar_cutoff_evaluation(data, cutoffs, WeightModelConfig())
    second = calendar_cutoff_evaluation(data, cutoffs, WeightModelConfig())
    pd.testing.assert_frame_equal(first, second)
    assert "INSUFFICIENT_DATA" in set(first["status"])


def test_robustness_is_deterministic_private_and_synthetic_labeled() -> None:
    data = generate_synthetic_datasets(44).body_weight
    first = evaluate_weight_robustness(data, data_origin="SYNTHETIC")
    second = evaluate_weight_robustness(data, data_origin="SYNTHETIC")
    pd.testing.assert_frame_equal(first.comparison, second.comparison)
    pd.testing.assert_frame_equal(first.intervals, second.intervals)
    assert first.recommendation_state == "INSUFFICIENT_REAL_DATA"
    assert not {"user_id", "session_id", "source_id"}.intersection(first.errors.columns)
    assert (
        first.predictions["training_max_target_date"]
        < first.predictions["prediction_date"]
    ).all()


def test_synthetic_cannot_be_labeled_real() -> None:
    try:
        evaluate_weight_robustness(
            generate_synthetic_datasets().body_weight, data_origin="REAL"
        )
    except ValueError as error:
        assert "cannot be labeled" in str(error)
    else:
        raise AssertionError("Synthetic origin guard failed")


def test_robustness_report_has_required_safe_sections() -> None:
    result = evaluate_weight_robustness(
        generate_synthetic_datasets().body_weight, data_origin="SYNTHETIC"
    )
    report = render_robustness_report(result)
    assert "Data origin: SYNTHETIC" in report
    assert f"Preferred method: {result.preferred_method}" in report
    assert "Empirical interval diagnostics" in report
    assert "Abstention summary" in report
    assert "Production recommendation state: INSUFFICIENT_REAL_DATA" in report
    assert "synthetic_user_001" not in report
