"""Deterministic, source-local next-session strength baselines."""

from __future__ import annotations

import numpy as np
import pandas as pd


def last_session_prediction(current_max_weight_kg: float) -> float:
    return max(0.0, float(current_max_weight_kg))


def recent_trend_prediction(history: pd.DataFrame, *, window: int) -> float:
    usable = history.loc[:, ["max_weight_kg"]].dropna().tail(window)
    current = float(usable["max_weight_kg"].iloc[-1])
    if len(usable) < 2:
        return last_session_prediction(current)
    x = np.arange(len(usable), dtype=float)
    y = usable["max_weight_kg"].astype(float).to_numpy()
    denominator = float(np.square(x - x.mean()).sum())
    if denominator == 0:
        return last_session_prediction(current)
    slope = float(((x - x.mean()) * (y - y.mean())).sum() / denominator)
    return max(0.0, current + slope)
