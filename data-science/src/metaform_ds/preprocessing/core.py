"""Pure, issue-preserving dataframe preprocessing."""

from __future__ import annotations

from collections.abc import Sequence

import pandas as pd


def normalize_datetime_columns(
    frame: pd.DataFrame, columns: Sequence[str]
) -> pd.DataFrame:
    result = frame.copy()
    for column in columns:
        result[column] = pd.to_datetime(result[column], utc=True, errors="coerce")
    return result


def to_numeric_columns(frame: pd.DataFrame, columns: Sequence[str]) -> pd.DataFrame:
    """Convert Decimal-like values and invalid strings to nullable numeric values."""
    result = frame.copy()
    for column in columns:
        result[column] = pd.to_numeric(result[column], errors="coerce")
    return result


def sort_chronologically(
    frame: pd.DataFrame,
    *,
    timestamp_column: str,
    group_columns: Sequence[str] = ("anonymous_user_id",),
) -> pd.DataFrame:
    columns = [*group_columns, timestamp_column]
    return frame.sort_values(columns, kind="stable").reset_index(drop=True)


def add_elapsed_days(
    frame: pd.DataFrame,
    *,
    timestamp_column: str,
    group_columns: Sequence[str],
    output_column: str = "days_since_first",
) -> pd.DataFrame:
    result = sort_chronologically(
        frame, timestamp_column=timestamp_column, group_columns=group_columns
    )
    first = result.groupby(list(group_columns), dropna=False)[
        timestamp_column
    ].transform("min")
    result[output_column] = (
        (result[timestamp_column] - first).dt.total_seconds() / 86_400
    ).astype("Float64")
    return result


def aggregate_daily(
    frame: pd.DataFrame,
    *,
    timestamp_column: str,
    value_columns: Sequence[str],
    aggregation: str = "mean",
) -> pd.DataFrame:
    """Aggregate values by anonymous user and UTC calendar day."""
    if frame.empty:
        return frame.copy()
    result = normalize_datetime_columns(frame, [timestamp_column])
    result["date"] = result[timestamp_column].dt.floor("D")
    return (
        result.groupby(["anonymous_user_id", "date"], as_index=False)[
            list(value_columns)
        ]
        .agg(aggregation)
        .sort_values(["anonymous_user_id", "date"], kind="stable")
        .reset_index(drop=True)
    )


def aggregate_weekly(
    frame: pd.DataFrame,
    *,
    timestamp_column: str,
    value_columns: Sequence[str],
    aggregation: str = "sum",
) -> pd.DataFrame:
    """Aggregate into UTC Monday-start weeks, consistent with the dashboard."""
    if frame.empty:
        return frame.copy()
    result = normalize_datetime_columns(frame, [timestamp_column])
    normalized = result[timestamp_column].dt.floor("D")
    result["week_start"] = normalized - pd.to_timedelta(normalized.dt.weekday, unit="D")
    return (
        result.groupby(["anonymous_user_id", "week_start"], as_index=False)[
            list(value_columns)
        ]
        .agg(aggregation)
        .sort_values(["anonymous_user_id", "week_start"], kind="stable")
        .reset_index(drop=True)
    )


def derive_session_strength_representation(raw_sets: pd.DataFrame) -> pd.DataFrame:
    """Reduce raw sets using the Dashboard/Weight Tracker representative rule.

    Expected input includes completion, source, weight, reps, and warmup fields.
    Incomplete, warmup, null-weight, and source-inconsistent rows are unusable for
    V1 strength representation and are excluded here after quality reporting.
    """
    output_columns = [
        "anonymous_user_id",
        "session_id_anonymous",
        "session_date",
        "source_type",
        "source_key_anonymous",
        "max_weight_kg",
        "max_reps_at_max_weight",
        "total_volume_kg",
        "working_set_count",
    ]
    if raw_sets.empty:
        return pd.DataFrame(columns=output_columns)
    frame = raw_sets.copy()
    valid = frame.loc[
        frame["completed"].fillna(False)
        & ~frame["is_warmup"].fillna(True)
        & frame["weight_kg"].notna()
        & frame["source_type"].isin(["EXERCISE", "CUSTOM_MACHINE"])
        & frame["source_key_anonymous"].notna()
    ].copy()
    if valid.empty:
        return pd.DataFrame(columns=output_columns)
    keys = [
        "anonymous_user_id",
        "session_id_anonymous",
        "session_date",
        "source_type",
        "source_key_anonymous",
    ]
    valid["set_volume_kg"] = valid["weight_kg"] * valid["reps"]
    maximum = valid.groupby(keys, dropna=False)["weight_kg"].transform("max")
    valid["reps_at_max"] = valid["reps"].where(valid["weight_kg"].eq(maximum))
    return (
        valid.groupby(keys, as_index=False, dropna=False)
        .agg(
            max_weight_kg=("weight_kg", "max"),
            max_reps_at_max_weight=("reps_at_max", "max"),
            total_volume_kg=("set_volume_kg", "sum"),
            working_set_count=("weight_kg", "size"),
        )
        .sort_values(
            ["anonymous_user_id", "source_key_anonymous", "session_date"],
            kind="stable",
        )
        .reset_index(drop=True)
    )
