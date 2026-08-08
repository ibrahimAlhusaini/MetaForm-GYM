from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pandas as pd
from fastapi.testclient import TestClient

from metaform_ds.modeling.strength.baselines import last_session_prediction
from metaform_ds.serving.app import app
from metaform_ds.serving.schemas import StrengthPredictionRequest
from metaform_ds.serving.strength_predictor import predict_strength


def _payload(count: int = 5) -> dict[str, object]:
    start = datetime(2026, 8, 1, tzinfo=UTC)
    return {
        "sourceType": "EXERCISE",
        "sessions": [
            {
                "completedAt": (start + timedelta(days=index)).isoformat(),
                "maxWeightKg": 70 + index,
            }
            for index in range(count)
        ],
    }


def test_route_available_and_reuses_frozen_baseline() -> None:
    response = TestClient(app).post("/v1/strength/predict", json=_payload())
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "AVAILABLE"
    assert body["estimatedNextMaxWeightKg"] == last_session_prediction(74)
    assert body["expectedChangeKg"] == 0
    assert body["method"] == "LAST_SESSION"
    assert body["methodVersion"] == "strength-next-session-v1"


def test_empty_and_insufficient_history_abstain() -> None:
    client = TestClient(app)
    empty = client.post(
        "/v1/strength/predict",
        json={"sourceType": "CUSTOM_MACHINE", "sessions": []},
    ).json()
    assert empty["reliability"]["reasonCodes"] == ["NO_COMPLETED_SOURCE_HISTORY"]
    short = client.post("/v1/strength/predict", json=_payload(4)).json()
    assert short["status"] == "ABSTAINED"
    assert short["estimatedNextMaxWeightKg"] is None
    assert short["reliability"]["reasonCodes"] == ["INSUFFICIENT_SOURCE_HISTORY"]


def test_schema_bounds_and_malformed_history() -> None:
    client = TestClient(app)
    assert client.post("/v1/strength/predict", json=_payload(31)).status_code == 422
    malformed = _payload()
    malformed["sessions"] = [{"completedAt": "not-a-date", "maxWeightKg": -1}]
    assert client.post("/v1/strength/predict", json=malformed).status_code == 422
    assert (
        client.post(
            "/v1/strength/predict",
            json={**_payload(), "userId": "forbidden"},
        ).status_code
        == 422
    )


def test_duplicate_future_and_stale_histories_abstain() -> None:
    duplicate = _payload()
    sessions = duplicate["sessions"]
    assert isinstance(sessions, list)
    sessions[1]["completedAt"] = sessions[0]["completedAt"]
    assert TestClient(app).post("/v1/strength/predict", json=duplicate).json()[
        "reliability"
    ]["reasonCodes"] == ["INVALID_STRENGTH_HISTORY"]
    request = StrengthPredictionRequest.model_validate(_payload())
    stale = predict_strength(request, now=datetime(2027, 1, 1, tzinfo=UTC))
    assert stale.reliability.reason_codes == ["EXCESSIVE_RECENT_GAP"]


def test_input_not_mutated_and_prediction_nonnegative() -> None:
    request = StrengthPredictionRequest.model_validate(_payload())
    before = request.model_dump()
    result = predict_strength(request, now=datetime(2026, 8, 10, tzinfo=UTC))
    assert result.estimated_next_max_weight_kg is not None
    assert result.estimated_next_max_weight_kg >= 0
    assert request.model_dump() == before
    assert pd.notna(result.history.recent_cadence_days)
