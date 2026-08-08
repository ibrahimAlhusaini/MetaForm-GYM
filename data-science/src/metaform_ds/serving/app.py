"""Local-only FastAPI application for the Body Weight Research Preview."""

from __future__ import annotations

from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response

from metaform_ds.serving.predictor import predict_body_weight
from metaform_ds.serving.schemas import (
    BodyWeightPredictionRequest,
    BodyWeightPredictionResponse,
    HealthResponse,
)

MAX_REQUEST_BYTES = 32_768

app = FastAPI(
    title="MetaForm Body Weight Prediction",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
)


@app.middleware("http")
async def reject_oversized_requests(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    content_length = request.headers.get("content-length")
    if content_length is not None and int(content_length) > MAX_REQUEST_BYTES:
        return JSONResponse(
            status_code=413,
            content={"detail": "Request body is too large"},
        )
    return await call_next(request)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="body-weight-prediction",
        preview_status="RESEARCH_PREVIEW",
    )


@app.post(
    "/v1/body-weight/predict",
    response_model=BodyWeightPredictionResponse,
)
def predict(request: BodyWeightPredictionRequest) -> BodyWeightPredictionResponse:
    return predict_body_weight(request)
