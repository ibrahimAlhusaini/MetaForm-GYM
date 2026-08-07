from __future__ import annotations

import pandas as pd

from metaform_ds.modeling.weight.baselines import (
    last_value_prediction,
    recent_trend_prediction,
)
from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.targets import (
    MODEL_FEATURE_COLUMNS,
    build_weight_prediction_examples,
)


def _weight_frame(dates: list[str], weights: list[float]) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "anonymous_user_id": "anonymous-test-user",
            "measured_at": pd.to_datetime(dates, utc=True),
            "weight_kg": weights,
            "fitness_goal": "LOSE_FAT",
            "activity_level": "MODERATE",
        }
    )


def _small_config(**overrides: int) -> WeightModelConfig:
    values = {
        "minimum_prior_measurements": 1,
        "minimum_training_rows": 1,
    }
    values.update(overrides)
    return WeightModelConfig(**values)


def test_exact_target_horizon_match() -> None:
    frame = _weight_frame(
        ["2026-01-01", "2026-01-02", "2026-01-09"], [81.0, 80.5, 80.0]
    )
    result = build_weight_prediction_examples(frame, _small_config())
    assert len(result.examples) == 1
    assert result.examples.loc[0, "target_offset_days"] == 7
    assert result.examples.loc[0, "actual_weight_kg"] == 80


def test_tolerance_target_chooses_nearest_deterministically() -> None:
    frame = _weight_frame(
        ["2026-01-01", "2026-01-02", "2026-01-08", "2026-01-10"],
        [81.0, 80.5, 80.1, 79.9],
    )
    result = build_weight_prediction_examples(frame, _small_config())
    first = result.examples.iloc[0]
    assert first["target_offset_days"] == 6
    assert first["actual_weight_kg"] == 80.1


def test_no_future_target_returns_no_example_and_reason() -> None:
    frame = _weight_frame(["2026-01-01", "2026-01-02"], [81.0, 80.5])
    result = build_weight_prediction_examples(frame, _small_config())
    assert result.examples.empty
    reasons = result.exclusion_reasons.set_index("reason")["count"]
    assert reasons["no_observed_target_in_window"] == 1


def test_minimum_prior_history_is_enforced() -> None:
    dates = pd.date_range("2026-01-01", periods=15, freq="D", tz="UTC")
    frame = _weight_frame(
        [value.isoformat() for value in dates],
        [80 - index * 0.1 for index in range(15)],
    )
    result = build_weight_prediction_examples(frame, WeightModelConfig())
    assert result.examples["prediction_date"].min() == dates[5]
    reasons = result.exclusion_reasons.set_index("reason")["count"]
    assert reasons["insufficient_prior_history"] == 5


def test_target_construction_sorts_users_chronologically() -> None:
    frame = _weight_frame(
        ["2026-01-09", "2026-01-01", "2026-01-02"], [80.0, 81.0, 80.5]
    )
    result = build_weight_prediction_examples(frame, _small_config())
    assert result.examples.loc[0, "prediction_date"] == pd.Timestamp(
        "2026-01-02", tz="UTC"
    )


def test_future_target_value_never_appears_in_features() -> None:
    original = _weight_frame(
        ["2026-01-01", "2026-01-02", "2026-01-09"], [81.0, 80.5, 80.0]
    )
    changed = original.copy()
    changed.loc[2, "weight_kg"] = 999.0
    first = build_weight_prediction_examples(original, _small_config()).examples
    second = build_weight_prediction_examples(changed, _small_config()).examples
    pd.testing.assert_series_equal(
        first.loc[0, MODEL_FEATURE_COLUMNS], second.loc[0, MODEL_FEATURE_COLUMNS]
    )
    assert first.loc[0, "actual_weight_kg"] != second.loc[0, "actual_weight_kg"]


def test_last_value_baseline_is_current_weight() -> None:
    assert last_value_prediction(78.4) == 78.4


def test_recent_trend_uses_only_supplied_past_history() -> None:
    history = _weight_frame(
        ["2026-01-01", "2026-01-03", "2026-01-05"], [80.0, 82.0, 84.0]
    )
    prediction = recent_trend_prediction(
        history,
        prediction_date=pd.Timestamp("2026-01-05", tz="UTC"),
        target_date=pd.Timestamp("2026-01-12", tz="UTC"),
        trend_window=3,
    )
    assert prediction == 91.0


def test_recent_trend_falls_back_for_same_timestamp_history() -> None:
    history = _weight_frame(["2026-01-01", "2026-01-01"], [80.0, 81.0])
    prediction = recent_trend_prediction(
        history,
        prediction_date=pd.Timestamp("2026-01-01", tz="UTC"),
        target_date=pd.Timestamp("2026-01-08", tz="UTC"),
        trend_window=5,
    )
    assert prediction == 81.0


def test_baselines_are_deterministic() -> None:
    history = _weight_frame(["2026-01-01", "2026-01-03"], [80.0, 79.8])
    arguments = {
        "prediction_date": pd.Timestamp("2026-01-03", tz="UTC"),
        "target_date": pd.Timestamp("2026-01-10", tz="UTC"),
        "trend_window": 5,
    }
    assert recent_trend_prediction(history, **arguments) == recent_trend_prediction(
        history, **arguments
    )


def test_same_date_order_is_stable_and_missing_categories_are_safe() -> None:
    frame = _weight_frame(
        ["2026-01-01", "2026-01-01", "2026-01-08"], [80.0, 81.0, 80.5]
    )
    frame[["fitness_goal", "activity_level"]] = pd.NA
    result = build_weight_prediction_examples(frame, _small_config())
    assert result.examples.loc[0, "current_weight_kg"] == 81.0
    assert result.examples.loc[0, "previous_weight_kg"] == 80.0
    assert pd.isna(result.examples.loc[0, "fitness_goal"])
