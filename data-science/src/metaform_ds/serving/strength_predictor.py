"""Live adapter around the frozen Strength V1 Last Session baseline."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

import numpy as np
import pandas as pd

from metaform_ds.modeling.strength.baselines import last_session_prediction
from metaform_ds.modeling.strength.config import StrengthModelConfig
from metaform_ds.serving.schemas import (
    StrengthHistorySummary,
    StrengthPredictionRequest,
    StrengthPredictionResponse,
    StrengthReasonCode,
    StrengthReliability,
)

MAX_RECENT_GAP_DAYS = 45.0


def _response(
    request: StrengthPredictionRequest,
    *,
    status: Literal["AVAILABLE", "ABSTAINED"],
    current: float | None,
    estimate: float | None,
    cadence: float | None,
    reasons: list[StrengthReasonCode],
) -> StrengthPredictionResponse:
    return StrengthPredictionResponse(
        status=status,
        preview_status="RESEARCH_PREVIEW",
        method="LAST_SESSION",
        method_version="strength-next-session-v1",
        source_type=request.source_type,
        estimated_next_max_weight_kg=estimate,
        current_max_weight_kg=current,
        expected_change_kg=(
            None if estimate is None or current is None else estimate - current
        ),
        history=StrengthHistorySummary(
            completed_source_sessions=len(request.sessions),
            recent_cadence_days=cadence,
        ),
        reliability=StrengthReliability(reason_codes=reasons),
        disclaimer_code="EXPERIMENTAL_STRENGTH_ESTIMATE",
    )


def predict_strength(
    request: StrengthPredictionRequest,
    *,
    now: datetime | None = None,
    config: StrengthModelConfig | None = None,
) -> StrengthPredictionResponse:
    """Return a conservative next-session estimate without mutating input."""
    settings = config or StrengthModelConfig()
    if not request.sessions:
        return _response(
            request,
            status="ABSTAINED",
            current=None,
            estimate=None,
            cadence=None,
            reasons=["NO_COMPLETED_SOURCE_HISTORY"],
        )
    rows = pd.DataFrame(
        [
            {
                "completed_at": item.completed_at.astimezone(UTC),
                "max_weight_kg": float(item.max_weight_kg),
            }
            for item in request.sessions
        ]
    ).sort_values("completed_at", kind="stable", ignore_index=True)
    dates = pd.to_datetime(rows["completed_at"], utc=True)
    intervals = (
        dates.tail(settings.trend_window).diff().dt.total_seconds().div(86_400).dropna()
    )
    cadence = None if intervals.empty else float(intervals.median())
    current = float(rows.iloc[-1]["max_weight_kg"])
    effective_now = (now or datetime.now(UTC)).astimezone(UTC)
    if dates.duplicated().any() or dates.gt(pd.Timestamp(effective_now)).any():
        return _response(
            request,
            status="ABSTAINED",
            current=current,
            estimate=None,
            cadence=cadence,
            reasons=["INVALID_STRENGTH_HISTORY"],
        )
    if len(rows) - 1 < settings.minimum_prior_sessions:
        return _response(
            request,
            status="ABSTAINED",
            current=current,
            estimate=None,
            cadence=cadence,
            reasons=["INSUFFICIENT_SOURCE_HISTORY"],
        )
    gap = (pd.Timestamp(effective_now) - dates.iloc[-1]).total_seconds() / 86_400
    if gap > MAX_RECENT_GAP_DAYS:
        return _response(
            request,
            status="ABSTAINED",
            current=current,
            estimate=None,
            cadence=cadence,
            reasons=["EXCESSIVE_RECENT_GAP"],
        )
    estimate = last_session_prediction(current)
    if not np.isfinite(estimate) or estimate < 0:
        return _response(
            request,
            status="ABSTAINED",
            current=current,
            estimate=None,
            cadence=cadence,
            reasons=["INTERNAL_PREDICTION_UNAVAILABLE"],
        )
    return _response(
        request,
        status="AVAILABLE",
        current=current,
        estimate=float(estimate),
        cadence=cadence,
        reasons=[],
    )
