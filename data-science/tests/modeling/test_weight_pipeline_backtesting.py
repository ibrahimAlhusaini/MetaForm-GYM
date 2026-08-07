from __future__ import annotations

import inspect

import numpy as np
import pandas as pd

from metaform_ds.modeling.weight.backtesting import expanding_window_backtest
from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.pipeline import (
    build_weight_regression_pipeline,
    model_input,
)
from metaform_ds.modeling.weight.targets import build_weight_prediction_examples
from metaform_ds.utils.synthetic import generate_synthetic_datasets


def _examples() -> pd.DataFrame:
    synthetic = generate_synthetic_datasets(42).body_weight
    return build_weight_prediction_examples(synthetic).examples


def test_sklearn_pipeline_builds_and_predicts_numeric() -> None:
    examples = _examples()
    source = examples.copy(deep=True)
    pipeline = build_weight_regression_pipeline()
    pipeline.fit(model_input(examples.iloc[:8]), examples.iloc[:8]["actual_weight_kg"])
    prediction = pipeline.predict(model_input(examples.iloc[8:9]))
    assert isinstance(float(prediction[0]), float)
    pd.testing.assert_frame_equal(examples, source)


def test_unknown_categorical_values_are_safe() -> None:
    examples = _examples()
    pipeline = build_weight_regression_pipeline()
    pipeline.fit(model_input(examples.iloc[:8]), examples.iloc[:8]["actual_weight_kg"])
    unknown = examples.iloc[8:9].copy()
    unknown["fitness_goal"] = "UNSEEN_GOAL"
    unknown["activity_level"] = "UNSEEN_ACTIVITY"
    assert np.isfinite(pipeline.predict(model_input(unknown))[0])


def test_backtest_has_no_random_split_path() -> None:
    source = inspect.getsource(expanding_window_backtest)
    assert "train_test_split" not in source
    assert "sample(" not in source


def test_training_and_label_dates_precede_each_validation_origin() -> None:
    result = expanding_window_backtest(_examples(), WeightModelConfig())
    assert result.status == "COMPLETE"
    assert (
        result.predictions["training_max_prediction_date"]
        < result.predictions["prediction_date"]
    ).all()
    assert (
        result.predictions["training_max_target_date"]
        < result.predictions["prediction_date"]
    ).all()


def test_expanding_training_window_grows_monotonically() -> None:
    result = expanding_window_backtest(_examples(), WeightModelConfig())
    counts = result.folds["training_row_count"]
    assert counts.is_monotonic_increasing
    assert counts.iloc[-1] > counts.iloc[0]


def test_multi_user_backtest_has_no_cross_user_future_labels() -> None:
    first = generate_synthetic_datasets(7).body_weight
    second = generate_synthetic_datasets(8).body_weight.copy()
    second["anonymous_user_id"] = "synthetic_user_002"
    examples = build_weight_prediction_examples(pd.concat([first, second])).examples
    result = expanding_window_backtest(examples, WeightModelConfig())
    assert (
        result.predictions["training_max_target_date"]
        < result.predictions["prediction_date"]
    ).all()
    assert result.predictions["anonymous_user_id"].nunique() == 2


def test_too_small_training_set_is_structured_insufficient_data() -> None:
    config = WeightModelConfig(minimum_training_rows=100)
    result = expanding_window_backtest(_examples(), config)
    assert result.status == "INSUFFICIENT_DATA"
    assert result.predictions.empty
    assert result.reasons
