"""Strict public schemas for the local body-weight prediction service."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_PREDICTION_MEASUREMENTS = 120
MAX_STRENGTH_SESSIONS = 30


def _to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class ServiceModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
        extra="forbid",
    )


class BodyWeightMeasurementInput(ServiceModel):
    measured_at: datetime
    weight_kg: Annotated[float, Field(ge=30, le=350)]

    @field_validator("measured_at")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("measuredAt must include a timezone offset")
        return value


class BodyWeightPredictionRequest(ServiceModel):
    measurements: Annotated[
        list[BodyWeightMeasurementInput],
        Field(max_length=MAX_PREDICTION_MEASUREMENTS),
    ]


class PredictionInterval(ServiceModel):
    available: Literal[False]
    lower_kg: float | None
    upper_kg: float | None
    coverage_target: float
    method: Literal["EMPIRICAL"]


PredictionReasonCode = Literal[
    "INSUFFICIENT_PRIOR_HISTORY",
    "EXCESSIVE_RECENT_GAP",
    "INVALID_MEASUREMENT_HISTORY",
    "NO_RECENT_MEASUREMENT",
    "INTERNAL_PREDICTION_UNAVAILABLE",
]


class PredictionReliability(ServiceModel):
    prior_measurement_count: int
    recent_cadence_days: float | None
    reason_codes: list[PredictionReasonCode]


class BodyWeightPredictionResponse(ServiceModel):
    status: Literal["AVAILABLE", "ABSTAINED"]
    preview_status: Literal["RESEARCH_PREVIEW"]
    method: Literal["RECENT_TREND"]
    method_version: str
    forecast_horizon_days: Literal[7]
    prediction_date: datetime
    target_date: datetime
    predicted_weight_kg: float | None
    current_weight_kg: float | None
    expected_change_kg: float | None
    interval: PredictionInterval
    reliability: PredictionReliability
    disclaimer_code: Literal["EXPERIMENTAL_TREND_FORECAST"]


class HealthResponse(ServiceModel):
    status: Literal["ok"]
    service: Literal["body-weight-prediction"]
    preview_status: Literal["RESEARCH_PREVIEW"]


class StrengthSessionInput(ServiceModel):
    completed_at: datetime
    max_weight_kg: Annotated[float, Field(gt=0, le=1_000)]

    @field_validator("completed_at")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("completedAt must include a timezone offset")
        return value


class StrengthPredictionRequest(ServiceModel):
    source_type: Literal["EXERCISE", "CUSTOM_MACHINE"]
    sessions: Annotated[
        list[StrengthSessionInput], Field(max_length=MAX_STRENGTH_SESSIONS)
    ]


StrengthReasonCode = Literal[
    "INSUFFICIENT_SOURCE_HISTORY",
    "NO_COMPLETED_SOURCE_HISTORY",
    "EXCESSIVE_RECENT_GAP",
    "INVALID_STRENGTH_HISTORY",
    "INTERNAL_PREDICTION_UNAVAILABLE",
]


class StrengthHistorySummary(ServiceModel):
    completed_source_sessions: int
    recent_cadence_days: float | None


class StrengthReliability(ServiceModel):
    reason_codes: list[StrengthReasonCode]


class StrengthPredictionResponse(ServiceModel):
    status: Literal["AVAILABLE", "ABSTAINED"]
    preview_status: Literal["RESEARCH_PREVIEW"]
    method: Literal["LAST_SESSION"]
    method_version: Literal["strength-next-session-v1"]
    source_type: Literal["EXERCISE", "CUSTOM_MACHINE"]
    estimated_next_max_weight_kg: float | None
    current_max_weight_kg: float | None
    expected_change_kg: float | None
    history: StrengthHistorySummary
    reliability: StrengthReliability
    disclaimer_code: Literal["EXPERIMENTAL_STRENGTH_ESTIMATE"]
