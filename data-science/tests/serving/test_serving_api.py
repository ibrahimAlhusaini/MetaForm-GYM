from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from metaform_ds.serving.app import app

client = TestClient(app)


def _measurements(count: int = 6) -> list[dict[str, object]]:
    now = datetime.now(UTC)
    return [
        {
            "measuredAt": (now - timedelta(days=(count - index - 1) * 2)).isoformat(),
            "weightKg": 82 - index * 0.1,
        }
        for index in range(count)
    ]


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "body-weight-prediction",
        "previewStatus": "RESEARCH_PREVIEW",
    }


def test_prediction_endpoint_returns_public_contract_without_user_id() -> None:
    response = client.post(
        "/v1/body-weight/predict", json={"measurements": _measurements()}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "AVAILABLE"
    assert body["method"] == "RECENT_TREND"
    assert body["interval"]["available"] is False
    assert "userId" not in response.text


def test_malformed_or_identity_bearing_request_is_rejected() -> None:
    malformed = client.post(
        "/v1/body-weight/predict",
        json={"measurements": [{"measuredAt": "not-a-date", "weightKg": -1}]},
    )
    identity_bearing = client.post(
        "/v1/body-weight/predict",
        json={"measurements": _measurements(), "userId": "private"},
    )
    timezone_missing = client.post(
        "/v1/body-weight/predict",
        json={"measurements": [{"measuredAt": "2026-08-08T12:00:00", "weightKg": 80}]},
    )
    assert malformed.status_code == 422
    assert identity_bearing.status_code == 422
    assert timezone_missing.status_code == 422


def test_oversized_request_is_rejected() -> None:
    response = client.post(
        "/v1/body-weight/predict",
        content=b"{}",
        headers={"content-type": "application/json", "content-length": "40000"},
    )
    assert response.status_code == 413


def test_invalid_length_and_streamed_oversized_request_are_rejected() -> None:
    invalid_length = client.post(
        "/v1/body-weight/predict",
        content=b"{}",
        headers={"content-type": "application/json", "content-length": "invalid"},
    )
    streamed = client.post(
        "/v1/body-weight/predict",
        content=(chunk for chunk in [b"{" + b"x" * 20_000, b"x" * 20_000 + b"}"]),
        headers={"content-type": "application/json"},
    )
    assert invalid_length.status_code == 400
    assert streamed.status_code == 413
    assert "x" * 100 not in streamed.text
