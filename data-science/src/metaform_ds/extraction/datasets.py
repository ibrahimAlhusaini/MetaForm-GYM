"""Privacy-preserving conversion from query rows to public dataset contracts."""

from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any

import pandas as pd
from sqlalchemy import Engine

from metaform_ds.contracts import (
    BODY_WEIGHT_CONTRACT,
    NUTRITION_CONTRACT,
    STRENGTH_CONTRACT,
    USER_FITNESS_CONTEXT_CONTRACT,
    WORKOUT_ACTIVITY_CONTRACT,
    DatasetContract,
)
from metaform_ds.db import read_dataframe
from metaform_ds.extraction.queries import (
    BODY_WEIGHT_SQL,
    NUTRITION_SQL,
    STRENGTH_PROGRESSION_SQL,
    USER_FITNESS_CONTEXT_SQL,
    WORKOUT_ACTIVITY_SQL,
)
from metaform_ds.utils.privacy import assert_export_safe, pseudonymize_series


def _date_parameters(
    date_from: datetime | str | None, date_to: datetime | str | None
) -> dict[str, Any]:
    return {"date_from": date_from, "date_to": date_to}


def _public_frame(
    raw: pd.DataFrame,
    contract: DatasetContract,
    *,
    secret: str | None,
    datetime_columns: tuple[str, ...] = (),
    numeric_columns: tuple[str, ...] = (),
) -> pd.DataFrame:
    if raw.empty:
        return contract.empty_frame()
    frame = raw.copy()
    frame["anonymous_user_id"] = pseudonymize_series(
        frame.pop("user_id"), domain="user", secret=secret
    ).to_numpy()
    for column in datetime_columns:
        frame[column] = pd.to_datetime(frame[column], utc=True, errors="coerce")
    for column in numeric_columns:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    result = contract.conform(frame)
    assert_export_safe(result)
    return result


def extract_body_weight_dataset(
    engine: Engine,
    *,
    secret: str | None,
    date_from: datetime | str | None = None,
    date_to: datetime | str | None = None,
) -> pd.DataFrame:
    """Extract measurement events; same-timestamp rows are retained and ordered."""
    raw = read_dataframe(engine, BODY_WEIGHT_SQL, _date_parameters(date_from, date_to))
    return _public_frame(
        raw,
        BODY_WEIGHT_CONTRACT,
        secret=secret,
        datetime_columns=("measured_at",),
        numeric_columns=("weight_kg", "height_cm"),
    ).sort_values(["anonymous_user_id", "measured_at"], kind="stable")


def extract_strength_progression_dataset(
    engine: Engine,
    *,
    secret: str | None,
    date_from: datetime | str | None = None,
    date_to: datetime | str | None = None,
) -> pd.DataFrame:
    """Extract dashboard-compatible per-source, per-completed-session strength."""
    raw = read_dataframe(
        engine, STRENGTH_PROGRESSION_SQL, _date_parameters(date_from, date_to)
    )
    if raw.empty:
        return STRENGTH_CONTRACT.empty_frame()
    raw["session_id_anonymous"] = pseudonymize_series(
        raw.pop("session_id"), domain="workout-session", secret=secret
    ).to_numpy()
    source_values = (
        raw["source_type"].astype("string")
        + ":"
        + raw.pop("source_id").astype("string")
    )
    raw["source_key_anonymous"] = pseudonymize_series(
        source_values, domain="strength-source", secret=secret
    ).to_numpy()
    return _public_frame(
        raw,
        STRENGTH_CONTRACT,
        secret=secret,
        datetime_columns=("session_date",),
        numeric_columns=(
            "max_weight_kg",
            "max_reps_at_max_weight",
            "total_volume_kg",
            "working_set_count",
        ),
    ).sort_values(
        [
            "anonymous_user_id",
            "source_key_anonymous",
            "session_date",
            "session_id_anonymous",
        ],
        kind="stable",
    )


def extract_workout_activity_dataset(
    engine: Engine,
    *,
    secret: str | None,
    include_incomplete: bool = False,
    date_from: datetime | str | None = None,
    date_to: datetime | str | None = None,
) -> pd.DataFrame:
    """Extract sessions; incomplete sessions are excluded by default."""
    params = _date_parameters(date_from, date_to) | {
        "include_incomplete": include_incomplete
    }
    raw = read_dataframe(engine, WORKOUT_ACTIVITY_SQL, params)
    if raw.empty:
        return WORKOUT_ACTIVITY_CONTRACT.empty_frame()
    raw["session_id_anonymous"] = pseudonymize_series(
        raw.pop("session_id"), domain="workout-session", secret=secret
    ).to_numpy()
    return _public_frame(
        raw,
        WORKOUT_ACTIVITY_CONTRACT,
        secret=secret,
        datetime_columns=("session_date",),
        numeric_columns=(
            "duration_minutes",
            "exercise_count",
            "working_set_count",
            "total_volume_kg",
        ),
    ).sort_values(["anonymous_user_id", "session_date"], kind="stable")


def extract_nutrition_dataset(
    engine: Engine,
    *,
    secret: str | None,
    date_from: datetime | str | None = None,
    date_to: datetime | str | None = None,
) -> pd.DataFrame:
    """Extract stored nutrition history without duplicating application formulas."""
    raw = read_dataframe(engine, NUTRITION_SQL, _date_parameters(date_from, date_to))
    return _public_frame(
        raw,
        NUTRITION_CONTRACT,
        secret=secret,
        datetime_columns=("calculated_at",),
        numeric_columns=(
            "weight_kg_used",
            "maintenance_calories",
            "recommended_calories",
            "protein_grams",
            "carbohydrate_grams",
            "fat_grams",
            "water_liters",
        ),
    ).sort_values(["anonymous_user_id", "calculated_at"], kind="stable")


def _utc_age(birth_date: Any, as_of_date: date) -> int | None:
    parsed = pd.to_datetime(birth_date, errors="coerce")
    if pd.isna(parsed):
        return None
    born = pd.Timestamp(parsed).date()
    age = (
        as_of_date.year
        - born.year
        - ((as_of_date.month, as_of_date.day) < (born.month, born.day))
    )
    return int(age)


def extract_user_fitness_context_dataset(
    engine: Engine,
    *,
    secret: str | None,
    as_of_date: date | None = None,
) -> pd.DataFrame:
    """Extract minimal profile context and derive age with backend UTC semantics."""
    raw = read_dataframe(engine, USER_FITNESS_CONTEXT_SQL)
    if raw.empty:
        return USER_FITNESS_CONTEXT_CONTRACT.empty_frame()
    effective_date = as_of_date or datetime.now(UTC).date()
    raw["age"] = raw.pop("birth_date").map(
        lambda value: _utc_age(value, effective_date)
    )
    return _public_frame(
        raw,
        USER_FITNESS_CONTEXT_CONTRACT,
        secret=secret,
        numeric_columns=("age", "height_cm", "current_weight_kg"),
    ).sort_values("anonymous_user_id", kind="stable")
