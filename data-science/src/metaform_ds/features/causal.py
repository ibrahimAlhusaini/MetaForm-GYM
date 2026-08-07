"""Explainable time-series features that never inspect future rows."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Literal

import pandas as pd

from metaform_ds.preprocessing import add_elapsed_days, sort_chronologically


def _past_rolling(
    values: pd.Series,
    *,
    window: int,
    minimum: int = 1,
    operation: Literal["mean", "max"] = "mean",
) -> pd.Series:
    """Shift before rolling so a row's target cannot enter its own features."""
    past = values.shift(1)
    rolling = past.rolling(window=window, min_periods=minimum, center=False)
    result = rolling.max() if operation == "max" else rolling.mean()
    return result


def add_body_weight_features(frame: pd.DataFrame) -> pd.DataFrame:
    if frame.empty:
        result = frame.copy()
        for column in (
            "days_since_first_measurement",
            "previous_weight_kg",
            "rolling_mean_7",
            "rolling_mean_14",
            "recent_change_kg",
            "measurement_frequency_30d",
        ):
            result[column] = pd.Series(dtype="Float64")
        return result
    result = add_elapsed_days(
        frame,
        timestamp_column="measured_at",
        group_columns=("anonymous_user_id",),
        output_column="days_since_first_measurement",
    )
    grouped = result.groupby("anonymous_user_id", sort=False, group_keys=False)
    result["previous_weight_kg"] = grouped["weight_kg"].shift(1)
    result["rolling_mean_7"] = grouped["weight_kg"].transform(
        lambda values: _past_rolling(values, window=7)
    )
    result["rolling_mean_14"] = grouped["weight_kg"].transform(
        lambda values: _past_rolling(values, window=14)
    )
    result["recent_change_kg"] = result["previous_weight_kg"] - grouped[
        "weight_kg"
    ].shift(2)
    result["measurement_frequency_30d"] = grouped["measured_at"].transform(
        lambda values: values.map(
            lambda current: int(
                ((values < current) & (values >= current - pd.Timedelta(days=30))).sum()
            )
        )
    )
    return result


def add_strength_features(frame: pd.DataFrame) -> pd.DataFrame:
    if frame.empty:
        result = frame.copy()
        for column in (
            "session_index",
            "days_since_first_session",
            "previous_max_weight",
            "rolling_max_5",
            "recent_average_weight_5",
            "recent_volume_5",
            "days_since_previous_session",
        ):
            result[column] = pd.Series(dtype="Float64")
        return result
    keys = ["anonymous_user_id", "source_key_anonymous"]
    result = add_elapsed_days(
        frame,
        timestamp_column="session_date",
        group_columns=keys,
        output_column="days_since_first_session",
    )
    grouped = result.groupby(keys, sort=False, group_keys=False)
    result["session_index"] = grouped.cumcount().astype("Int64")
    result["previous_max_weight"] = grouped["max_weight_kg"].shift(1)
    result["rolling_max_5"] = grouped["max_weight_kg"].transform(
        lambda values: _past_rolling(values, window=5, operation="max")
    )
    result["recent_average_weight_5"] = grouped["max_weight_kg"].transform(
        lambda values: _past_rolling(values, window=5)
    )
    result["recent_volume_5"] = grouped["total_volume_kg"].transform(
        lambda values: _past_rolling(values, window=5)
    )
    result["days_since_previous_session"] = (
        grouped["session_date"].diff().dt.total_seconds() / 86_400
    )
    return result


def chronological_split(
    frame: pd.DataFrame,
    *,
    timestamp_column: str,
    train_fraction: float = 0.8,
    group_columns: Sequence[str] = (),
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Split in time order; random shuffling is intentionally unsupported."""
    if not 0 < train_fraction < 1:
        raise ValueError("train_fraction must be between zero and one")
    ordered = sort_chronologically(
        frame, timestamp_column=timestamp_column, group_columns=group_columns
    )
    boundary = int(len(ordered) * train_fraction)
    if len(ordered) > 1:
        boundary = min(max(boundary, 1), len(ordered) - 1)
    return ordered.iloc[:boundary].copy(), ordered.iloc[boundary:].copy()
