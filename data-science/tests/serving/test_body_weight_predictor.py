from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pandas as pd
import pytest
from pydantic import ValidationError

from metaform_ds.modeling.weight.baselines import recent_trend_prediction
from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.serving.predictor import predict_body_weight
from metaform_ds.serving.schemas import BodyWeightPredictionRequest

NOW = datetime(2026, 8, 8, 12, tzinfo=UTC)


def _request(
    *, count: int = 6, latest_gap_days: int = 0
) -> BodyWeightPredictionRequest:
    latest = NOW - timedelta(days=latest_gap_days)
    start = latest - timedelta(days=(count - 1) * 2)
    return BodyWeightPredictionRequest.model_validate(
        {
            "measurements": [
                {
                    "measuredAt": (start + timedelta(days=index * 2)).isoformat(),
                    "weightKg": 84 - index * 0.2,
                }
                for index in range(count)
            ]
        }
    )


def test_live_predictor_reuses_recent_trend_and_frozen_horizon() -> None:
    request = _request()
    result = predict_body_weight(request, now=NOW)
    history = pd.DataFrame(
        [
            {"measured_at": item.measured_at, "weight_kg": item.weight_kg}
            for item in request.measurements
        ]
    )
    expected = recent_trend_prediction(
        history,
        prediction_date=pd.Timestamp(NOW),
        target_date=pd.Timestamp(NOW + timedelta(days=7)),
        trend_window=WeightModelConfig().trend_window,
    )
    assert result.status == "AVAILABLE"
    assert result.method == "RECENT_TREND"
    assert result.forecast_horizon_days == 7
    assert result.target_date - result.prediction_date == timedelta(days=7)
    assert result.predicted_weight_kg == pytest.approx(expected)


def test_minimum_prior_history_is_enforced() -> None:
    result = predict_body_weight(_request(count=5), now=NOW)
    assert result.status == "ABSTAINED"
    assert result.reliability.reason_codes == ["INSUFFICIENT_PRIOR_HISTORY"]
    assert result.predicted_weight_kg is None


def test_excessive_recent_gap_abstains() -> None:
    result = predict_body_weight(_request(latest_gap_days=15), now=NOW)
    assert result.status == "ABSTAINED"
    assert result.reliability.reason_codes == ["EXCESSIVE_RECENT_GAP"]


def test_invalid_duplicate_history_abstains() -> None:
    request = _request()
    request.measurements[1].measured_at = request.measurements[0].measured_at
    result = predict_body_weight(request, now=NOW)
    assert result.status == "ABSTAINED"
    assert result.reliability.reason_codes == ["INVALID_MEASUREMENT_HISTORY"]


def test_empty_history_abstains_without_fake_interval() -> None:
    result = predict_body_weight(BodyWeightPredictionRequest(measurements=[]), now=NOW)
    assert result.reliability.reason_codes == ["NO_RECENT_MEASUREMENT"]
    assert not result.interval.available
    assert result.interval.lower_kg is None
    assert result.interval.upper_kg is None


def test_eligible_prediction_is_numeric_and_input_is_not_mutated() -> None:
    request = _request()
    before = request.model_dump(mode="json")
    result = predict_body_weight(request, now=NOW)
    assert isinstance(result.predicted_weight_kg, float)
    assert result.preview_status == "RESEARCH_PREVIEW"
    assert request.model_dump(mode="json") == before


def test_request_is_bounded_and_needs_no_user_identifier() -> None:
    item = {"measuredAt": NOW.isoformat(), "weightKg": 80}
    valid = BodyWeightPredictionRequest.model_validate({"measurements": [item]})
    assert valid.measurements[0].weight_kg == 80
    with pytest.raises(ValidationError):
        BodyWeightPredictionRequest.model_validate({"measurements": [item] * 121})


def test_existing_recent_trend_regression_value_is_unchanged() -> None:
    history = pd.DataFrame(
        {
            "measured_at": pd.date_range("2026-01-01", periods=5, freq="2D", tz="UTC"),
            "weight_kg": [82.0, 81.8, 81.6, 81.4, 81.2],
        }
    )
    prediction = recent_trend_prediction(
        history,
        prediction_date=pd.Timestamp("2026-01-09T00:00:00Z"),
        target_date=pd.Timestamp("2026-01-16T00:00:00Z"),
        trend_window=5,
    )
    assert prediction == pytest.approx(80.5)
