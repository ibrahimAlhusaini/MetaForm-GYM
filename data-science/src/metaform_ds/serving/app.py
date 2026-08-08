"""Local-only FastAPI application for the Body Weight Research Preview."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import JSONResponse, Response
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from metaform_ds.serving.predictor import predict_body_weight
from metaform_ds.serving.schemas import (
    BodyWeightPredictionRequest,
    BodyWeightPredictionResponse,
    HealthResponse,
    StrengthPredictionRequest,
    StrengthPredictionResponse,
)
from metaform_ds.serving.strength_predictor import predict_strength

MAX_REQUEST_BYTES = 32_768

app = FastAPI(
    title="MetaForm Prediction Research Preview",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
)


class RequestSizeLimitMiddleware:
    """Bound declared and streamed bodies before validation without logging them."""

    def __init__(self, app: ASGIApp, maximum_bytes: int) -> None:
        self.app = app
        self.maximum_bytes = maximum_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        headers = dict(scope.get("headers", []))
        raw_length = headers.get(b"content-length")
        if raw_length is not None:
            try:
                declared_length = int(raw_length)
            except ValueError:
                await self._reject(scope, receive, send, 400, "Invalid Content-Length")
                return
            if declared_length < 0:
                await self._reject(scope, receive, send, 400, "Invalid Content-Length")
                return
            if declared_length > self.maximum_bytes:
                await self._reject(
                    scope, receive, send, 413, "Request body is too large"
                )
                return

        body = bytearray()
        disconnected = False
        while True:
            message = await receive()
            if message["type"] == "http.request":
                body.extend(message.get("body", b""))
                if len(body) > self.maximum_bytes:
                    await self._reject(
                        scope,
                        receive,
                        send,
                        413,
                        "Request body is too large",
                    )
                    return
                if not message.get("more_body", False):
                    break
            elif message["type"] == "http.disconnect":
                disconnected = True
                break

        replayed = False

        async def replay_receive() -> Message:
            nonlocal replayed
            if disconnected or replayed:
                return {"type": "http.disconnect"}
            replayed = True
            return {"type": "http.request", "body": bytes(body), "more_body": False}

        await self.app(scope, replay_receive, send)

    @staticmethod
    async def _reject(
        scope: Scope,
        receive: Receive,
        send: Send,
        status_code: int,
        detail: str,
    ) -> None:
        response: Response = JSONResponse(
            status_code=status_code,
            content={"detail": detail},
        )
        await response(scope, receive, send)


app.add_middleware(RequestSizeLimitMiddleware, maximum_bytes=MAX_REQUEST_BYTES)


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


@app.post("/v1/strength/predict", response_model=StrengthPredictionResponse)
def predict_strength_route(
    request: StrengthPredictionRequest,
) -> StrengthPredictionResponse:
    return predict_strength(request)
