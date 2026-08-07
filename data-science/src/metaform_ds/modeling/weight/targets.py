"""Causal feature and 7-day observed-target construction."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from metaform_ds.modeling.weight.baselines import (
    last_value_prediction,
    recent_trend_prediction,
)
from metaform_ds.modeling.weight.config import WeightModelConfig

NUMERIC_FEATURE_COLUMNS = [
    "current_weight_kg",
    "previous_weight_kg",
    "days_since_first_measurement",
    "days_since_previous_measurement",
    "rolling_mean_3_observations",
    "rolling_mean_5_observations",
    "recent_change_kg",
    "measurement_frequency_recent",
]
CATEGORICAL_FEATURE_COLUMNS = ["fitness_goal", "activity_level"]
MODEL_FEATURE_COLUMNS = [*NUMERIC_FEATURE_COLUMNS, *CATEGORICAL_FEATURE_COLUMNS]

EXAMPLE_COLUMNS = [
    "anonymous_user_id",
    "prediction_date",
    "target_date",
    "target_offset_days",
    "prior_measurement_count",
    "recent_measurement_cadence_days",
    *MODEL_FEATURE_COLUMNS,
    "actual_weight_kg",
    "baseline_last_value_kg",
    "baseline_trend_kg",
]


@dataclass(frozen=True, slots=True)
class WeightTargetResult:
    examples: pd.DataFrame
    eligibility_summary: pd.DataFrame
    exclusion_reasons: pd.DataFrame


def _empty_examples() -> pd.DataFrame:
    return pd.DataFrame(columns=EXAMPLE_COLUMNS)


def _summary(
    *,
    input_rows: int,
    valid_rows: int,
    examples: pd.DataFrame,
    invalid_rows: int,
    insufficient_history: int,
    no_target: int,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    summary = pd.DataFrame(
        [
            {
                "input_rows": input_rows,
                "valid_measurement_rows": valid_rows,
                "eligible_examples": len(examples),
                "eligible_users": examples["anonymous_user_id"].nunique(),
                "excluded_rows": invalid_rows + insufficient_history + no_target,
            }
        ]
    )
    reasons = pd.DataFrame(
        [
            {"reason": "invalid_measurement", "count": invalid_rows},
            {"reason": "insufficient_prior_history", "count": insufficient_history},
            {"reason": "no_observed_target_in_window", "count": no_target},
        ]
    )
    return summary, reasons


def _feature_values(
    history: pd.DataFrame, config: WeightModelConfig
) -> dict[str, object]:
    current = history.iloc[-1]
    current_date = pd.Timestamp(current["measured_at"])
    current_weight = float(current["weight_kg"])
    previous = history.iloc[-2] if len(history) >= 2 else None
    previous_weight = float(previous["weight_kg"]) if previous is not None else np.nan
    days_since_previous = np.nan
    if previous is not None:
        previous_date = pd.Timestamp(previous["measured_at"])
        days_since_previous = (current_date - previous_date).total_seconds() / 86_400
    frequency_start = current_date - pd.Timedelta(
        days=config.measurement_frequency_days
    )
    recent_count = int(history["measured_at"].ge(frequency_start).sum())
    recent_dates = pd.to_datetime(
        history["measured_at"].tail(config.trend_window), utc=True
    )
    recent_intervals = recent_dates.diff().dt.total_seconds().div(86_400).dropna()
    recent_cadence = (
        float(recent_intervals.median()) if not recent_intervals.empty else np.nan
    )
    return {
        "prior_measurement_count": len(history) - 1,
        "recent_measurement_cadence_days": recent_cadence,
        "current_weight_kg": current_weight,
        "previous_weight_kg": previous_weight,
        "days_since_first_measurement": (
            current_date - pd.Timestamp(history.iloc[0]["measured_at"])
        ).total_seconds()
        / 86_400,
        "days_since_previous_measurement": days_since_previous,
        "rolling_mean_3_observations": float(
            history["weight_kg"].tail(config.rolling_short_window).mean()
        ),
        "rolling_mean_5_observations": float(
            history["weight_kg"].tail(config.rolling_long_window).mean()
        ),
        "recent_change_kg": (
            current_weight - previous_weight if previous is not None else np.nan
        ),
        "measurement_frequency_recent": recent_count,
        "fitness_goal": current.get("fitness_goal", pd.NA),
        "activity_level": current.get("activity_level", pd.NA),
    }


def build_weight_prediction_examples(
    frame: pd.DataFrame, config: WeightModelConfig | None = None
) -> WeightTargetResult:
    """Build causal features and nearest observed targets around seven days ahead."""
    settings = config or WeightModelConfig()
    required = {"anonymous_user_id", "measured_at", "weight_kg"}
    missing = sorted(required.difference(frame.columns))
    if missing and not frame.empty:
        raise ValueError(f"Missing body-weight columns: {', '.join(missing)}")
    working = frame.copy(deep=True)
    if working.empty:
        examples = _empty_examples()
        summary, reasons = _summary(
            input_rows=0,
            valid_rows=0,
            examples=examples,
            invalid_rows=0,
            insufficient_history=0,
            no_target=0,
        )
        return WeightTargetResult(examples, summary, reasons)
    working["_source_order"] = np.arange(len(working))
    working["measured_at"] = pd.to_datetime(
        working["measured_at"], utc=True, errors="coerce"
    )
    working["weight_kg"] = pd.to_numeric(working["weight_kg"], errors="coerce")
    valid_mask = (
        working["anonymous_user_id"].notna()
        & working["measured_at"].notna()
        & working["weight_kg"].gt(0)
    )
    invalid_rows = int((~valid_mask).sum())
    valid = working.loc[valid_mask].sort_values(
        ["anonymous_user_id", "measured_at", "_source_order"], kind="stable"
    )
    rows: list[dict[str, object]] = []
    insufficient_history = 0
    no_target = 0
    minimum_delta = pd.Timedelta(days=settings.target_minimum_days)
    maximum_delta = pd.Timedelta(days=settings.target_maximum_days)
    ideal_delta = pd.Timedelta(days=settings.forecast_horizon_days)
    for anonymous_user_id, group in valid.groupby(
        "anonymous_user_id", sort=False, dropna=False
    ):
        ordered = group.reset_index(drop=True)
        for position, (_, current) in enumerate(ordered.iterrows()):
            if position < settings.minimum_prior_measurements:
                insufficient_history += 1
                continue
            prediction_date = pd.Timestamp(current["measured_at"])
            future = ordered.iloc[position + 1 :].copy()
            deltas = future["measured_at"] - prediction_date
            candidates = future.loc[deltas.between(minimum_delta, maximum_delta)].copy()
            if candidates.empty:
                no_target += 1
                continue
            candidates["_distance"] = (
                candidates["measured_at"] - prediction_date - ideal_delta
            ).abs()
            target = candidates.sort_values(
                ["_distance", "measured_at", "_source_order"], kind="stable"
            ).iloc[0]
            target_date = pd.Timestamp(target["measured_at"])
            history = ordered.iloc[: position + 1]
            feature_values = _feature_values(history, settings)
            rows.append(
                {
                    "anonymous_user_id": str(anonymous_user_id),
                    "prediction_date": prediction_date,
                    "target_date": target_date,
                    "target_offset_days": (
                        target_date - prediction_date
                    ).total_seconds()
                    / 86_400,
                    **feature_values,
                    "actual_weight_kg": float(target["weight_kg"]),
                    "baseline_last_value_kg": last_value_prediction(
                        float(current["weight_kg"])
                    ),
                    "baseline_trend_kg": recent_trend_prediction(
                        history,
                        prediction_date=prediction_date,
                        target_date=target_date,
                        trend_window=settings.trend_window,
                    ),
                }
            )
    examples = pd.DataFrame(rows, columns=EXAMPLE_COLUMNS)
    if not examples.empty:
        examples = examples.sort_values(
            ["prediction_date", "anonymous_user_id", "target_date"], kind="stable"
        ).reset_index(drop=True)
    summary, reasons = _summary(
        input_rows=len(frame),
        valid_rows=len(valid),
        examples=examples,
        invalid_rows=invalid_rows,
        insufficient_history=insufficient_history,
        no_target=no_target,
    )
    return WeightTargetResult(examples, summary, reasons)
