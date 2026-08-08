from __future__ import annotations

import inspect

import numpy as np
import pandas as pd
import pytest

from metaform_ds.extraction.queries import STRENGTH_PROGRESSION_SQL
from metaform_ds.modeling.strength import (
    StrengthModelConfig,
    build_strength_prediction_examples,
    evaluate_strength_model,
    render_strength_evaluation_report,
)
from metaform_ds.modeling.strength.backtesting import expanding_window_backtest
from metaform_ds.modeling.strength.baselines import (
    last_session_prediction,
    recent_trend_prediction,
)
from metaform_ds.modeling.strength.diagnostics import add_segments, segment_metrics
from metaform_ds.modeling.strength.metrics import (
    best_baseline,
    metric_comparison,
    regression_metrics,
    relative_mae_improvement,
)
from metaform_ds.modeling.strength.pipeline import (
    build_linear_pipeline,
    build_ridge_pipeline,
    model_input,
)
from metaform_ds.modeling.strength.selection import select_preferred_method
from metaform_ds.modeling.strength.targets import MODEL_FEATURE_COLUMNS
from metaform_ds.utils.synthetic import generate_synthetic_datasets


def _history(source: str = "source-a", source_type: str = "EXERCISE") -> pd.DataFrame:
    rows = 8
    return pd.DataFrame(
        {
            "anonymous_user_id": "anonymous-user",
            "session_id_anonymous": [f"session-{index}" for index in range(rows)],
            "session_date": pd.date_range(
                "2026-01-01", periods=rows, freq="6D", tz="UTC"
            ),
            "source_type": source_type,
            "source_key_anonymous": source,
            "source_name": "Catalog Exercise" if source_type == "EXERCISE" else pd.NA,
            "max_weight_kg": [50.0, 51.0, 52.0, 53.0, 54.0, 55.0, 53.0, 56.0],
            "max_reps_at_max_weight": 6,
            "total_volume_kg": [
                900.0,
                918.0,
                936.0,
                954.0,
                972.0,
                990.0,
                954.0,
                1008.0,
            ],
            "working_set_count": 3,
            "primary_muscle": "CHEST" if source_type == "EXERCISE" else pd.NA,
            "equipment_type": "BARBELL" if source_type == "EXERCISE" else pd.NA,
        }
    )


def test_next_session_target_and_minimum_history_are_explicit() -> None:
    result = build_strength_prediction_examples(_history())
    first = result.examples.iloc[0]
    assert first["prior_session_count"] == 4
    assert first["current_max_weight_kg"] == 54.0
    assert first["actual_next_max_weight_kg"] == 55.0
    assert first["target_date"] > first["prediction_date"]
    assert (
        result.exclusion_reasons.set_index("reason").loc[
            "insufficient_prior_history", "count"
        ]
        == 4
    )


def test_targets_never_cross_sources_or_source_types() -> None:
    second = _history("source-b", "CUSTOM_MACHINE")
    second["max_weight_kg"] += 100
    examples = build_strength_prediction_examples(
        pd.concat([_history(), second], ignore_index=True)
    ).examples
    grouped = examples.groupby(["source_type", "source_key_anonymous"])[
        "actual_next_max_weight_kg"
    ]
    assert grouped.max().loc[("EXERCISE", "source-a")] < 100
    assert grouped.min().loc[("CUSTOM_MACHINE", "source-b")] > 100


def test_no_future_target_is_excluded_and_equal_times_order_stably() -> None:
    frame = _history()
    frame.loc[5, "session_date"] = frame.loc[4, "session_date"]
    first = build_strength_prediction_examples(frame).examples
    second = build_strength_prediction_examples(frame).examples
    pd.testing.assert_frame_equal(first, second)
    assert (first["target_date"] > first["prediction_date"]).all()
    assert "session-4" in set(first["prediction_session_id_anonymous"])
    assert "session-7" not in set(first["prediction_session_id_anonymous"])


def test_product_strength_filter_contract_is_preserved() -> None:
    normalized = " ".join(STRENGTH_PROGRESSION_SQL.lower().split())
    assert 'session."completedat" is not null' in normalized
    assert 'set_row."iswarmup" = false' in normalized
    assert 'set_row."weightkg" is not null' in normalized
    assert "'exercise'::text" in normalized
    assert "'custom_machine'::text" in normalized


def test_features_are_causal_and_current_values_are_correct() -> None:
    frame = _history()
    original = build_strength_prediction_examples(frame).examples.iloc[0]
    future_changed = frame.copy()
    future_changed.loc[6:, ["max_weight_kg", "total_volume_kg"]] = 9999.0
    changed = build_strength_prediction_examples(future_changed).examples.iloc[0]
    for column in MODEL_FEATURE_COLUMNS:
        left, right = original[column], changed[column]
        assert (pd.isna(left) and pd.isna(right)) or left == right
    assert original["previous_max_weight_kg"] == 53.0
    assert original["recent_change_kg"] == 1.0
    assert original["days_since_previous_session"] == 6.0
    assert original["recent_average_volume_3"] == pytest.approx(954.0)


def test_model_features_exclude_identifiers_and_machine_names() -> None:
    forbidden = {
        "anonymous_user_id",
        "source_key_anonymous",
        "source_name",
        "session_id_anonymous",
    }
    assert forbidden.isdisjoint(MODEL_FEATURE_COLUMNS)
    assert "source_type" in MODEL_FEATURE_COLUMNS


def test_baselines_are_deterministic_past_only_and_allow_decreases() -> None:
    history = _history().iloc[:6]
    assert last_session_prediction(55.0) == 55.0
    first = recent_trend_prediction(history, window=4)
    assert first == recent_trend_prediction(history.copy(), window=4)
    future = pd.concat([history, _history().iloc[6:]], ignore_index=True)
    assert first == recent_trend_prediction(future.iloc[:6], window=4)
    decreasing = history.copy()
    decreasing["max_weight_kg"] = [60, 58, 56, 54, 52, 50]
    assert recent_trend_prediction(decreasing, window=4) < 50
    assert recent_trend_prediction(history.iloc[:1], window=4) == 50.0


def test_linear_and_ridge_pipelines_are_safe_and_do_not_mutate_input() -> None:
    examples = build_strength_prediction_examples(
        generate_synthetic_datasets(42).strength
    ).examples
    source = examples.copy(deep=True)
    train, validation = examples.iloc[:20], examples.iloc[20:22].copy()
    validation["equipment_type"] = "UNSEEN_EQUIPMENT"
    for pipeline in (build_linear_pipeline(), build_ridge_pipeline()):
        pipeline.fit(model_input(train), train["actual_next_max_weight_kg"])
        assert np.isfinite(pipeline.predict(model_input(validation))).all()
    pd.testing.assert_frame_equal(examples, source)


def test_backtest_is_expanding_and_has_strict_label_cutoffs() -> None:
    examples = build_strength_prediction_examples(
        generate_synthetic_datasets(43).strength
    ).examples
    result = expanding_window_backtest(examples, StrengthModelConfig())
    assert result.status == "COMPLETE"
    assert "train_test_split" not in inspect.getsource(expanding_window_backtest)
    assert (
        result.predictions["training_max_prediction_date"]
        < result.predictions["prediction_date"]
    ).all()
    assert (
        result.predictions["training_max_target_date"]
        < result.predictions["prediction_date"]
    ).all()
    assert result.folds["training_row_count"].is_monotonic_increasing


def test_too_small_temporal_data_is_structured_insufficient() -> None:
    examples = build_strength_prediction_examples(_history()).examples
    result = expanding_window_backtest(
        examples, StrengthModelConfig(minimum_training_rows=100)
    )
    assert result.status == "INSUFFICIENT_DATA"
    assert result.predictions.empty
    assert result.reasons


def test_too_few_sources_is_structured_insufficient() -> None:
    examples = build_strength_prediction_examples(_history()).examples
    result = expanding_window_backtest(
        examples,
        StrengthModelConfig(
            minimum_training_rows=1, minimum_temporal_folds=1, minimum_sources=2
        ),
    )
    assert result.status == "INSUFFICIENT_DATA"
    assert "source histories" in result.reasons[0]


def test_metrics_baseline_and_improvement_are_correct_and_empty_safe() -> None:
    metric = regression_metrics(pd.Series([1.0, 3.0]), pd.Series([2.0, 1.0]))
    assert metric.mae_kg == 1.5
    assert metric.rmse_kg == pytest.approx(2.5**0.5)
    assert (
        regression_metrics(pd.Series(dtype=float), pd.Series(dtype=float)).mae_kg
        is None
    )
    comparison = metric_comparison(pd.DataFrame())
    assert comparison.empty
    assert best_baseline(comparison) is None
    assert relative_mae_improvement(2.0, 1.5) == 25.0


def test_segments_cover_source_history_cadence_and_mark_sparse_groups() -> None:
    result = evaluate_strength_model(
        generate_synthetic_datasets(44).strength, data_origin="SYNTHETIC"
    )
    assert set(result.predictions["source_type"]) == {"EXERCISE", "CUSTOM_MACHINE"}
    buckets = add_segments(
        pd.DataFrame(
            {"prior_session_count": [4, 7, 11], "recent_cadence_days": [5, 10, 20]}
        ),
        result.config,
    )
    assert list(buckets["history_bucket"]) == ["4-6", "7-10", "11+"]
    assert set(result.predictions["cadence_bucket"]).issubset(
        {"FREQUENT", "MODERATE", "SPARSE", "UNKNOWN"}
    )
    tiny = add_segments(result.predictions.iloc[:1], result.config)
    metrics = segment_metrics(tiny, "source_type", result.config)
    assert not metrics["sufficient"].any()


def test_selection_requires_gain_count_and_temporal_stability() -> None:
    comparison = pd.DataFrame(
        [
            {"method": "Last Session Baseline", "mae_kg": 2.0, "prediction_count": 20},
            {"method": "Recent Trend Baseline", "mae_kg": 2.2, "prediction_count": 20},
            {"method": "Linear Regression", "mae_kg": 1.7, "prediction_count": 20},
            {"method": "Ridge Regression", "mae_kg": 1.8, "prediction_count": 20},
        ]
    )
    stable = pd.DataFrame(
        [
            {"method": "Linear Regression", "fold_mae_cv": 0.2},
            {"method": "Ridge Regression", "fold_mae_cv": 0.2},
        ]
    )
    preferred, state, _ = select_preferred_method(
        comparison, stable, config=StrengthModelConfig()
    )
    assert (preferred, state) == ("Linear Regression", "ML_CANDIDATE_PROMISING")
    unstable = stable.assign(fold_mae_cv=2.0)
    preferred, state, _ = select_preferred_method(
        comparison, unstable, config=StrengthModelConfig()
    )
    assert (preferred, state) == ("Last Session Baseline", "BASELINE_PREFERRED")
    low_count = comparison.copy()
    low_count.loc[
        low_count["method"].str.contains("Regression"), "prediction_count"
    ] = 1
    preferred, _, _ = select_preferred_method(
        low_count, stable, config=StrengthModelConfig()
    )
    assert preferred == "Last Session Baseline"


def test_synthetic_evaluation_is_deterministic_and_honestly_labeled() -> None:
    first_data = generate_synthetic_datasets(45)
    second_data = generate_synthetic_datasets(45)
    pd.testing.assert_frame_equal(first_data.strength, second_data.strength)
    assert first_data.metadata["database_written"] is False
    assert set(first_data.strength["source_type"]) == {"EXERCISE", "CUSTOM_MACHINE"}
    assert first_data.strength["source_key_anonymous"].nunique() == 4
    first = evaluate_strength_model(first_data.strength, data_origin="SYNTHETIC")
    second = evaluate_strength_model(second_data.strength, data_origin="SYNTHETIC")
    pd.testing.assert_frame_equal(first.predictions, second.predictions)
    with pytest.raises(ValueError, match="cannot be labeled"):
        evaluate_strength_model(first_data.strength, data_origin="REAL")


def test_report_is_aggregate_private_and_documents_decision() -> None:
    result = evaluate_strength_model(
        generate_synthetic_datasets().strength, data_origin="SYNTHETIC"
    )
    report = render_strength_evaluation_report(result)
    assert "Data origin: SYNTHETIC" in report
    assert "next strictly later completed same-source session" in report
    assert "Last Session Baseline" in report
    assert "Preferred method" in report
    assert "Limitations" in report
    for value in result.predictions["anonymous_user_id"].unique():
        assert value not in report
    for value in result.predictions["source_key_anonymous"].unique():
        assert value not in report
    assert "Custom Machine" not in report
