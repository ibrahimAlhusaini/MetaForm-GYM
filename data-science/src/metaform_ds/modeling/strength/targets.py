"""Causal source-local features and next-completed-session targets."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from metaform_ds.modeling.strength.baselines import (
    last_session_prediction,
    recent_trend_prediction,
)
from metaform_ds.modeling.strength.config import StrengthModelConfig

NUMERIC_FEATURE_COLUMNS = [
    "current_max_weight_kg",
    "previous_max_weight_kg",
    "session_index",
    "days_since_first_session",
    "days_since_previous_session",
    "rolling_mean_max_weight_3",
    "rolling_max_weight_3",
    "recent_change_kg",
    "recent_average_volume_3",
    "current_session_volume_kg",
    "working_set_count",
    "max_reps_at_max_weight",
]
CATEGORICAL_FEATURE_COLUMNS = ["source_type", "primary_muscle", "equipment_type"]
MODEL_FEATURE_COLUMNS = [*NUMERIC_FEATURE_COLUMNS, *CATEGORICAL_FEATURE_COLUMNS]
IDENTIFIER_COLUMNS = ["anonymous_user_id", "source_key_anonymous"]


@dataclass(frozen=True, slots=True)
class StrengthTargetResult:
    examples: pd.DataFrame
    eligibility_summary: pd.DataFrame
    exclusion_reasons: pd.DataFrame


def _features(history: pd.DataFrame, config: StrengthModelConfig) -> dict[str, object]:
    current = history.iloc[-1]
    previous = history.iloc[-2]
    current_date = pd.Timestamp(current["session_date"])
    previous_date = pd.Timestamp(previous["session_date"])
    recent = history.tail(config.recent_window)
    gaps = (
        pd.to_datetime(history["session_date"].tail(config.trend_window), utc=True)
        .diff()
        .dt.total_seconds()
        .div(86_400)
        .dropna()
    )
    current_max = float(current["max_weight_kg"])
    previous_max = float(previous["max_weight_kg"])
    return {
        "prior_session_count": len(history) - 1,
        "recent_cadence_days": float(gaps.median()) if not gaps.empty else np.nan,
        "current_max_weight_kg": current_max,
        "previous_max_weight_kg": previous_max,
        "session_index": len(history) - 1,
        "days_since_first_session": (
            current_date - pd.Timestamp(history.iloc[0]["session_date"])
        ).total_seconds()
        / 86_400,
        "days_since_previous_session": (current_date - previous_date).total_seconds()
        / 86_400,
        "rolling_mean_max_weight_3": float(recent["max_weight_kg"].mean()),
        "rolling_max_weight_3": float(recent["max_weight_kg"].max()),
        "recent_change_kg": current_max - previous_max,
        "recent_average_volume_3": float(recent["total_volume_kg"].mean()),
        "current_session_volume_kg": float(current["total_volume_kg"]),
        "working_set_count": float(current["working_set_count"]),
        "max_reps_at_max_weight": float(current["max_reps_at_max_weight"]),
        "source_type": current["source_type"],
        "primary_muscle": current.get("primary_muscle", pd.NA),
        "equipment_type": current.get("equipment_type", pd.NA),
    }


def build_strength_prediction_examples(
    frame: pd.DataFrame, config: StrengthModelConfig | None = None
) -> StrengthTargetResult:
    settings = config or StrengthModelConfig()
    required = {
        *IDENTIFIER_COLUMNS,
        "session_id_anonymous",
        "session_date",
        "source_type",
        "max_weight_kg",
        "max_reps_at_max_weight",
        "total_volume_kg",
        "working_set_count",
    }
    missing = sorted(required.difference(frame.columns))
    if missing and not frame.empty:
        raise ValueError(f"Missing strength columns: {', '.join(missing)}")
    working = frame.copy(deep=True)
    if working.empty:
        examples = pd.DataFrame()
        return StrengthTargetResult(
            examples,
            pd.DataFrame(
                [
                    {
                        "input_rows": 0,
                        "valid_rows": 0,
                        "eligible_examples": 0,
                        "eligible_sources": 0,
                    }
                ]
            ),
            pd.DataFrame(columns=["reason", "count"]),
        )
    working["session_date"] = pd.to_datetime(
        working["session_date"], utc=True, errors="coerce"
    )
    for column in (
        "max_weight_kg",
        "max_reps_at_max_weight",
        "total_volume_kg",
        "working_set_count",
    ):
        working[column] = pd.to_numeric(working[column], errors="coerce")
    valid_mask = (
        working["anonymous_user_id"].notna()
        & working["source_key_anonymous"].notna()
        & working["session_id_anonymous"].notna()
        & working["source_type"].isin(["EXERCISE", "CUSTOM_MACHINE"])
        & working["session_date"].notna()
        & working["max_weight_kg"].gt(0)
    )
    valid = working.loc[valid_mask].sort_values(
        [*IDENTIFIER_COLUMNS, "source_type", "session_date", "session_id_anonymous"],
        kind="stable",
    )
    rows: list[dict[str, object]] = []
    insufficient = 0
    no_future = 0
    for (user, source_type, source), group in valid.groupby(
        ["anonymous_user_id", "source_type", "source_key_anonymous"],
        sort=False,
        dropna=False,
    ):
        ordered = group.reset_index(drop=True)
        for position in range(len(ordered)):
            current = ordered.iloc[position]
            if position < settings.minimum_prior_sessions:
                insufficient += 1
                continue
            prediction_date = pd.Timestamp(current["session_date"])
            future = ordered.iloc[position + 1 :]
            later = future.loc[future["session_date"].gt(prediction_date)]
            if later.empty:
                no_future += 1
                continue
            target = later.iloc[0]
            history = ordered.iloc[: position + 1]
            values = _features(history, settings)
            rows.append(
                {
                    "anonymous_user_id": str(user),
                    "source_key_anonymous": str(source),
                    "source_type": str(source_type),
                    "prediction_session_id_anonymous": str(
                        current["session_id_anonymous"]
                    ),
                    "prediction_date": prediction_date,
                    "target_date": pd.Timestamp(target["session_date"]),
                    **values,
                    "actual_next_max_weight_kg": float(target["max_weight_kg"]),
                    "baseline_last_session_kg": last_session_prediction(
                        float(current["max_weight_kg"])
                    ),
                    "baseline_recent_trend_kg": recent_trend_prediction(
                        history, window=settings.trend_window
                    ),
                }
            )
    examples = pd.DataFrame(rows)
    if not examples.empty:
        examples = examples.sort_values(
            [
                "prediction_date",
                "anonymous_user_id",
                "source_type",
                "source_key_anonymous",
                "prediction_session_id_anonymous",
            ],
            kind="stable",
        ).reset_index(drop=True)
    invalid = int((~valid_mask).sum())
    summary = pd.DataFrame(
        [
            {
                "input_rows": len(frame),
                "valid_rows": len(valid),
                "eligible_examples": len(examples),
                "eligible_sources": examples[
                    ["anonymous_user_id", "source_type", "source_key_anonymous"]
                ]
                .drop_duplicates()
                .shape[0]
                if not examples.empty
                else 0,
                "excluded_rows": invalid + insufficient + no_future,
            }
        ]
    )
    reasons = pd.DataFrame(
        [
            {"reason": "invalid_strength_row", "count": invalid},
            {"reason": "insufficient_prior_history", "count": insufficient},
            {"reason": "no_strictly_later_same_source_target", "count": no_future},
        ]
    )
    return StrengthTargetResult(examples, summary, reasons)
