"""Deterministic temporal baselines using only data known at prediction time."""

from __future__ import annotations

import numpy as np
import pandas as pd


def last_value_prediction(current_weight_kg: float) -> float:
    """Predict no change from the current observed weight."""
    return float(current_weight_kg)


def recent_trend_prediction(
    history: pd.DataFrame,
    *,
    prediction_date: pd.Timestamp,
    target_date: pd.Timestamp,
    trend_window: int,
) -> float:
    """Extrapolate a recent least-squares kg/day trend through the target date.

    The supplied history must end at the prediction observation. With fewer than
    two distinct timestamps, the function falls back to the last value baseline.
    """
    usable = history.loc[:, ["measured_at", "weight_kg"]].dropna().tail(trend_window)
    current_weight = float(usable["weight_kg"].iloc[-1])
    dates = pd.to_datetime(usable["measured_at"], utc=True)
    elapsed_days = (dates - dates.iloc[0]).dt.total_seconds().to_numpy() / 86_400
    weights = usable["weight_kg"].astype(float).to_numpy()
    denominator = float(np.square(elapsed_days - elapsed_days.mean()).sum())
    if len(usable) < 2 or denominator == 0:
        return last_value_prediction(current_weight)
    slope = float(
        ((elapsed_days - elapsed_days.mean()) * (weights - weights.mean())).sum()
        / denominator
    )
    forecast_days = (target_date - prediction_date).total_seconds() / 86_400
    return current_weight + slope * forecast_days
