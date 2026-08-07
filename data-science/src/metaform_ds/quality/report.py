"""Quality checks report issues; they never silently rewrite source data."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import pandas as pd


@dataclass(frozen=True, slots=True)
class QualityReport:
    dataset_name: str
    row_count: int
    column_count: int
    null_rates: pd.DataFrame
    issues: pd.DataFrame

    @property
    def issue_count(self) -> int:
        return int(self.issues["count"].sum()) if not self.issues.empty else 0


def _issue(code: str, severity: str, count: int, detail: str) -> dict[str, Any]:
    return {"code": code, "severity": severity, "count": count, "detail": detail}


def build_quality_report(
    frame: pd.DataFrame,
    *,
    dataset_name: str,
    timestamp_column: str | None = None,
    duplicate_timestamp_keys: list[str] | None = None,
    minimum_observations: int = 3,
) -> QualityReport:
    """Build a reusable report covering structural and domain-level anomalies."""
    null_rates = pd.DataFrame(
        {
            "column": frame.columns,
            "null_count": [int(frame[column].isna().sum()) for column in frame],
            "null_rate": [
                float(frame[column].isna().mean()) if len(frame) else 0.0
                for column in frame
            ],
        }
    )
    issues: list[dict[str, Any]] = []
    duplicates = int(frame.duplicated().sum())
    if duplicates:
        issues.append(
            _issue("duplicate_rows", "warning", duplicates, "Exact duplicate rows")
        )
    if duplicate_timestamp_keys and all(
        column in frame for column in duplicate_timestamp_keys
    ):
        duplicate_times = int(
            frame.duplicated(subset=duplicate_timestamp_keys, keep=False).sum()
        )
        if duplicate_times:
            issues.append(
                _issue(
                    "duplicate_timestamps",
                    "warning",
                    duplicate_times,
                    "Rows sharing a meaningful entity/timestamp key",
                )
            )
    positive_columns = [
        column
        for column in (
            "weight_kg",
            "height_cm",
            "current_weight_kg",
            "weight_kg_used",
            "max_weight_kg",
        )
        if column in frame
    ]
    for column in positive_columns:
        invalid = int((pd.to_numeric(frame[column], errors="coerce") <= 0).sum())
        if invalid:
            issues.append(
                _issue(
                    "non_positive_value", "error", invalid, f"{column} must be positive"
                )
            )
    nonnegative_columns = [
        column
        for column in (
            "duration_minutes",
            "maintenance_calories",
            "recommended_calories",
            "protein_grams",
            "carbohydrate_grams",
            "fat_grams",
            "water_liters",
            "total_volume_kg",
        )
        if column in frame
    ]
    for column in nonnegative_columns:
        invalid = int((pd.to_numeric(frame[column], errors="coerce") < 0).sum())
        if invalid:
            issues.append(
                _issue("negative_value", "error", invalid, f"{column} is negative")
            )
    if timestamp_column and timestamp_column in frame:
        dates = pd.to_datetime(frame[timestamp_column], utc=True, errors="coerce")
        impossible = int(
            (
                (dates < pd.Timestamp("1900-01-01", tz="UTC"))
                | (dates > pd.Timestamp(datetime.now(UTC)) + pd.Timedelta(days=1))
            ).sum()
        )
        if impossible:
            issues.append(
                _issue(
                    "impossible_dates",
                    "error",
                    impossible,
                    "Dates outside plausible bounds",
                )
            )
        if len(dates.dropna()) >= 2:
            ordered = dates.dropna().sort_values()
            long_gaps = int((ordered.diff().dt.days > 90).sum())
            if long_gaps:
                issues.append(
                    _issue(
                        "chronology_gaps", "info", long_gaps, "Gaps longer than 90 days"
                    )
                )
    if {"source_type", "primary_muscle", "equipment_type"}.issubset(frame.columns):
        inconsistent = int(
            (
                frame["source_type"].eq("CUSTOM_MACHINE")
                & (frame["primary_muscle"].notna() | frame["equipment_type"].notna())
            ).sum()
        )
        if inconsistent:
            issues.append(
                _issue(
                    "inconsistent_source_fields",
                    "error",
                    inconsistent,
                    "Custom machines contain standard-exercise metadata",
                )
            )
    group_keys = [
        column
        for column in ("anonymous_user_id", "source_key_anonymous")
        if column in frame
    ]
    if group_keys and len(frame):
        insufficient = int(
            (
                frame.groupby(group_keys, dropna=False).size() < minimum_observations
            ).sum()
        )
        if insufficient:
            issues.append(
                _issue(
                    "insufficient_observations",
                    "info",
                    insufficient,
                    f"Groups with fewer than {minimum_observations} observations",
                )
            )
    issue_frame = pd.DataFrame(issues, columns=["code", "severity", "count", "detail"])
    return QualityReport(
        dataset_name, len(frame), len(frame.columns), null_rates, issue_frame
    )
