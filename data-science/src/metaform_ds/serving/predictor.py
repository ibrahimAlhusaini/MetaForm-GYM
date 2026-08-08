"""Live adapter around the frozen Recent Trend baseline implementation."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

import numpy as np
import pandas as pd

from metaform_ds.modeling.weight.baselines import recent_trend_prediction
from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.serving.schemas import (
    BodyWeightPredictionRequest,
    BodyWeightPredictionResponse,
    PredictionInterval,
    PredictionReasonCode,
    PredictionReliability,
)


def _utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _recent_cadence_days(history: pd.DataFrame, trend_window: int) -> float | None:
    dates = pd.to_datetime(history["measured_at"].tail(trend_window), utc=True)
    intervals = dates.diff().dt.total_seconds().div(86_400).dropna()
    return None if intervals.empty else float(intervals.median())


def _result(
    *,
    status: Literal["AVAILABLE", "ABSTAINED"],
    prediction_date: datetime,
    current_weight_kg: float | None,
    prior_measurement_count: int,
    recent_cadence_days: float | None,
    reason_codes: list[PredictionReasonCode],
    predicted_weight_kg: float | None,
    config: WeightModelConfig,
) -> BodyWeightPredictionResponse:
    target_date = (
        prediction_date
        + pd.Timedelta(days=config.forecast_horizon_days).to_pytimedelta()
    )
    expected_change = (
        None
        if predicted_weight_kg is None or current_weight_kg is None
        else predicted_weight_kg - current_weight_kg
    )
    return BodyWeightPredictionResponse(
        status=status,
        preview_status="RESEARCH_PREVIEW",
        method="RECENT_TREND",
        method_version=f"{config.model_version}-recent-trend-v1",
        forecast_horizon_days=7,
        prediction_date=prediction_date,
        target_date=target_date,
        predicted_weight_kg=predicted_weight_kg,
        current_weight_kg=current_weight_kg,
        expected_change_kg=expected_change,
        interval=PredictionInterval(
            available=False,
            lower_kg=None,
            upper_kg=None,
            coverage_target=config.interval_coverage,
            method="EMPIRICAL",
        ),
        reliability=PredictionReliability(
            prior_measurement_count=prior_measurement_count,
            recent_cadence_days=recent_cadence_days,
            reason_codes=reason_codes,
        ),
        disclaimer_code="EXPERIMENTAL_TREND_FORECAST",
    )


def predict_body_weight(
    request: BodyWeightPredictionRequest,
    *,
    now: datetime | None = None,
    config: WeightModelConfig | None = None,
) -> BodyWeightPredictionResponse:
    """Return a point forecast or a safe abstention without mutating the input."""
    settings = config or WeightModelConfig()
    prediction_date = _utc(now or datetime.now(UTC))
    if not request.measurements:
        return _result(
            status="ABSTAINED",
            prediction_date=prediction_date,
            current_weight_kg=None,
            prior_measurement_count=0,
            recent_cadence_days=None,
            reason_codes=["NO_RECENT_MEASUREMENT"],
            predicted_weight_kg=None,
            config=settings,
        )

    history = pd.DataFrame(
        [
            {
                "measured_at": _utc(item.measured_at),
                "weight_kg": float(item.weight_kg),
            }
            for item in request.measurements
        ]
    ).sort_values("measured_at", kind="stable", ignore_index=True)
    latest = history.iloc[-1]
    current_weight = float(latest["weight_kg"])
    prior_count = len(history) - 1
    cadence = _recent_cadence_days(history, settings.trend_window)
    dates = pd.to_datetime(history["measured_at"], utc=True)
    if dates.duplicated().any() or dates.gt(pd.Timestamp(prediction_date)).any():
        return _result(
            status="ABSTAINED",
            prediction_date=prediction_date,
            current_weight_kg=current_weight,
            prior_measurement_count=prior_count,
            recent_cadence_days=cadence,
            reason_codes=["INVALID_MEASUREMENT_HISTORY"],
            predicted_weight_kg=None,
            config=settings,
        )
    if prior_count < settings.minimum_prior_measurements:
        return _result(
            status="ABSTAINED",
            prediction_date=prediction_date,
            current_weight_kg=current_weight,
            prior_measurement_count=prior_count,
            recent_cadence_days=cadence,
            reason_codes=["INSUFFICIENT_PRIOR_HISTORY"],
            predicted_weight_kg=None,
            config=settings,
        )
    recent_gap_days = (
        pd.Timestamp(prediction_date) - pd.Timestamp(latest["measured_at"])
    ).total_seconds() / 86_400
    if recent_gap_days > settings.maximum_recent_gap_days:
        return _result(
            status="ABSTAINED",
            prediction_date=prediction_date,
            current_weight_kg=current_weight,
            prior_measurement_count=prior_count,
            recent_cadence_days=cadence,
            reason_codes=["EXCESSIVE_RECENT_GAP"],
            predicted_weight_kg=None,
            config=settings,
        )
    target_date = pd.Timestamp(prediction_date) + pd.Timedelta(
        days=settings.forecast_horizon_days
    )
    prediction = recent_trend_prediction(
        history,
        prediction_date=pd.Timestamp(prediction_date),
        target_date=target_date,
        trend_window=settings.trend_window,
    )
    if not np.isfinite(prediction):
        return _result(
            status="ABSTAINED",
            prediction_date=prediction_date,
            current_weight_kg=current_weight,
            prior_measurement_count=prior_count,
            recent_cadence_days=cadence,
            reason_codes=["INTERNAL_PREDICTION_UNAVAILABLE"],
            predicted_weight_kg=None,
            config=settings,
        )
    return _result(
        status="AVAILABLE",
        prediction_date=prediction_date,
        current_weight_kg=current_weight,
        prior_measurement_count=prior_count,
        recent_cadence_days=cadence,
        reason_codes=[],
        predicted_weight_kg=float(prediction),
        config=settings,
    )
