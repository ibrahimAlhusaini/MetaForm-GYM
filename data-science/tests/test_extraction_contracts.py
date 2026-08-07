from __future__ import annotations

from decimal import Decimal

import pandas as pd
import pytest

from metaform_ds.contracts import (
    BODY_WEIGHT_CONTRACT,
    NUTRITION_CONTRACT,
    STRENGTH_CONTRACT,
    USER_FITNESS_CONTEXT_CONTRACT,
    WORKOUT_ACTIVITY_CONTRACT,
)
from metaform_ds.extraction import datasets


def _patch_read(monkeypatch: pytest.MonkeyPatch, frame: pd.DataFrame) -> None:
    monkeypatch.setattr(
        datasets, "read_dataframe", lambda *args, **kwargs: frame.copy()
    )


def test_body_weight_contract_sort_decimal_and_no_raw_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_read(
        monkeypatch,
        pd.DataFrame(
            {
                "user_id": ["raw-user", "raw-user"],
                "measured_at": ["2026-02-02T00:00:00Z", "2026-01-01T00:00:00Z"],
                "weight_kg": [Decimal("80.20"), Decimal("81.10")],
                "height_cm": [Decimal("178"), Decimal("178")],
                "fitness_goal": ["LOSE_FAT", "LOSE_FAT"],
                "activity_level": ["MODERATE", "MODERATE"],
            }
        ),
    )
    result = datasets.extract_body_weight_dataset(object(), secret="secret")
    assert list(result.columns) == BODY_WEIGHT_CONTRACT.columns
    assert result["weight_kg"].tolist() == [81.1, 80.2]
    assert "user_id" not in result
    assert (
        not result.astype("string")
        .apply(lambda column: column.str.contains("raw-user", regex=False).any())
        .any()
    )


def test_all_extractors_return_stable_empty_contracts(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_read(monkeypatch, pd.DataFrame())
    calls = [
        (datasets.extract_body_weight_dataset, BODY_WEIGHT_CONTRACT),
        (datasets.extract_strength_progression_dataset, STRENGTH_CONTRACT),
        (datasets.extract_workout_activity_dataset, WORKOUT_ACTIVITY_CONTRACT),
        (datasets.extract_nutrition_dataset, NUTRITION_CONTRACT),
        (datasets.extract_user_fitness_context_dataset, USER_FITNESS_CONTEXT_CONTRACT),
    ]
    for function, contract in calls:
        result = function(object(), secret="secret")
        assert result.empty
        assert list(result.columns) == contract.columns


def test_workout_duration_counts_and_completion_are_preserved(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_read(
        monkeypatch,
        pd.DataFrame(
            {
                "user_id": ["u"],
                "session_id": ["s"],
                "session_date": ["2026-01-01T10:00:00Z"],
                "completed": [True],
                "duration_minutes": [Decimal("62")],
                "exercise_count": [5],
                "working_set_count": [16],
                "total_volume_kg": [Decimal("4000")],
                "workout_plan_used": [True],
            }
        ),
    )
    result = datasets.extract_workout_activity_dataset(object(), secret="secret")
    assert result.loc[0, "duration_minutes"] == 62
    assert result.loc[0, "exercise_count"] == 5
    assert bool(result.loc[0, "completed"])
    assert "s" not in result.loc[0, "session_id_anonymous"]


def test_legacy_nutrition_nulls_are_retained_without_formula_recalculation(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_read(
        monkeypatch,
        pd.DataFrame(
            {
                "user_id": ["u"],
                "calculated_at": ["2026-01-01T00:00:00Z"],
                "weight_kg_used": [None],
                "fitness_goal": [None],
                "activity_level": [None],
                "maintenance_calories": [2300],
                "recommended_calories": [None],
                "protein_grams": [Decimal("145")],
                "carbohydrate_grams": [Decimal("250")],
                "fat_grams": [Decimal("70")],
                "water_liters": [Decimal("2.8")],
                "calculation_version": [None],
            }
        ),
    )
    result = datasets.extract_nutrition_dataset(object(), secret="secret")
    assert list(result.columns) == NUTRITION_CONTRACT.columns
    assert result.loc[0, "maintenance_calories"] == 2300
    assert pd.isna(result.loc[0, "recommended_calories"])
    assert pd.isna(result.loc[0, "weight_kg_used"])


def test_profile_age_uses_utc_calendar_semantics(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from datetime import date

    _patch_read(
        monkeypatch,
        pd.DataFrame(
            {
                "user_id": ["u"],
                "birth_date": ["2000-08-08"],
                "gender": ["MALE"],
                "height_cm": [180],
                "current_weight_kg": [80],
                "activity_level": ["MODERATE"],
                "fitness_goal": ["GENERAL_FITNESS"],
            }
        ),
    )
    result = datasets.extract_user_fitness_context_dataset(
        object(), secret="secret", as_of_date=date(2026, 8, 7)
    )
    assert result.loc[0, "age"] == 25
    assert "birth_date" not in result
