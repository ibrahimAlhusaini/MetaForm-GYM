from __future__ import annotations

from decimal import Decimal

import pandas as pd

from metaform_ds.features import (
    add_body_weight_features,
    add_strength_features,
    chronological_split,
    prepare_strength_model_dataset,
    prepare_weight_model_dataset,
)
from metaform_ds.preprocessing import derive_session_strength_representation


def test_strength_representation_filters_and_calculates_correctly() -> None:
    raw = pd.DataFrame(
        {
            "anonymous_user_id": ["u"] * 6,
            "session_id_anonymous": ["s1"] * 4 + ["s2", "s3"],
            "session_date": pd.to_datetime(
                ["2026-01-01"] * 4 + ["2026-01-02", "2026-01-03"], utc=True
            ),
            "completed": [True, True, True, True, False, True],
            "is_warmup": [True, False, False, False, False, False],
            "weight_kg": [20, Decimal("50"), Decimal("50"), None, 80, 90],
            "reps": [10, 8, 6, 4, 5, 3],
            "source_type": ["EXERCISE"] * 5 + [None],
            "source_key_anonymous": ["source"] * 6,
        }
    )
    result = derive_session_strength_representation(raw)
    assert len(result) == 1
    assert result.loc[0, "max_weight_kg"] == 50
    assert result.loc[0, "max_reps_at_max_weight"] == 8
    assert result.loc[0, "total_volume_kg"] == 700
    assert result.loc[0, "working_set_count"] == 2
    assert result.loc[0, "source_type"] == "EXERCISE"


def test_strength_representation_empty_input_is_safe() -> None:
    assert derive_session_strength_representation(pd.DataFrame()).empty


def test_body_weight_features_are_sorted_and_strictly_past_only() -> None:
    frame = pd.DataFrame(
        {
            "anonymous_user_id": ["u"] * 4,
            "measured_at": pd.to_datetime(
                ["2026-01-04", "2026-01-01", "2026-01-03", "2026-01-02"],
                utc=True,
            ),
            "weight_kg": [400.0, 10.0, 30.0, 20.0],
        }
    )
    result = add_body_weight_features(frame)
    assert result["weight_kg"].tolist() == [10, 20, 30, 400]
    assert pd.isna(result.loc[0, "previous_weight_kg"])
    assert result.loc[2, "previous_weight_kg"] == 20
    assert result.loc[2, "rolling_mean_7"] == 15
    assert result.loc[2, "rolling_mean_7"] != 400


def test_strength_lags_and_rolling_never_include_future_values() -> None:
    frame = pd.DataFrame(
        {
            "anonymous_user_id": ["u"] * 3,
            "source_key_anonymous": ["source"] * 3,
            "session_date": pd.to_datetime(
                ["2026-01-01", "2026-01-02", "2026-01-03"], utc=True
            ),
            "max_weight_kg": [50.0, 55.0, 999.0],
            "total_volume_kg": [500.0, 600.0, 9999.0],
        }
    )
    result = add_strength_features(frame)
    assert result.loc[1, "previous_max_weight"] == 50
    assert result.loc[1, "rolling_max_5"] == 50
    assert result.loc[1, "recent_volume_5"] == 500
    assert result.loc[1, "days_since_previous_session"] == 1


def test_chronological_split_preserves_order_and_boundary() -> None:
    frame = pd.DataFrame(
        {
            "when": pd.to_datetime(
                ["2026-01-03", "2026-01-01", "2026-01-04", "2026-01-02"],
                utc=True,
            )
        }
    )
    train, test = chronological_split(
        frame, timestamp_column="when", train_fraction=0.5
    )
    assert train["when"].max() < test["when"].min()
    assert len(train) == len(test) == 2


def test_model_preparation_returns_contracts_without_fitting() -> None:
    weight = pd.DataFrame(
        {
            "anonymous_user_id": ["u", "u"],
            "measured_at": pd.to_datetime(["2026-01-01", "2026-01-02"], utc=True),
            "weight_kg": [80.0, 79.8],
        }
    )
    prepared_weight = prepare_weight_model_dataset(weight)
    assert prepared_weight.target.name == "target_weight_kg"
    assert len(prepared_weight.features) == 2
    strength = pd.DataFrame(
        {
            "anonymous_user_id": ["u"],
            "source_key_anonymous": ["x"],
            "session_date": pd.to_datetime(["2026-01-01"], utc=True),
            "max_weight_kg": [50.0],
            "total_volume_kg": [500.0],
        }
    )
    prepared_strength = prepare_strength_model_dataset(strength)
    assert prepared_strength.target.name == "target_max_weight_kg"
