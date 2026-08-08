# Body Weight Prediction Product Integration V1

## Status and method selection

This feature is a `RESEARCH_PREVIEW`, not a production-validated, clinically
validated, medical, or guaranteed forecast. It estimates body weight
approximately seven days ahead by extending the recent observed trend and may
abstain. It never changes a fitness plan, nutrition target, or medical decision.

The live method is **Recent Trend Baseline**. Linear Regression was evaluated,
and Ridge Regression improved substantially over Linear, but Ridge did not pass
the frozen promotion criteria. Linear and Ridge therefore remain research
candidates only. This is evidence-based selection, not ML deployment for
appearance. The frozen evidence protocol and `WeightModelConfig` are unchanged.
Current evidence remains `NO_REAL_DATA` with
`integration_review_allowed = false`.

## Architecture

```text
React /app/weights/body-weight
  -> authenticated Express API
     -> user-scoped Prisma BodyMeasurement query (maximum 120)
        -> local FastAPI service
           -> existing recent_trend_prediction
              -> validated structured response
```

FastAPI provides the existing Python implementation with a narrow health-checked
runtime boundary. It does not run notebooks, shell out, train a model, or load a
serialized model. Node owns authentication, authorization, database access,
timeouts, and public errors. Python has no database URL, JWT logic, CORS, or user
identity.

## Cross-language prediction contract

TypeScript owns the browser/API contract in
`packages/shared-types/src/body-weight.ts`; Pydantic owns the internal Python
schema in `metaform_ds.serving.schemas`. Stable values are intentionally
duplicated and guarded by tests plus Node response validation.

The response provides `AVAILABLE | ABSTAINED`, `RESEARCH_PREVIEW`,
`RECENT_TREND`, method version, seven-day horizon, UTC prediction/target dates,
nullable point values, empirical interval metadata, reliability facts, stable
reason codes, and `EXPERIMENTAL_TREND_FORECAST`. It never exposes DataFrames,
model objects, identities, or provider errors. The protected route accepts no
`userId` or arbitrary prediction date.

## Prediction, abstention, and intervals

The runtime calls `recent_trend_prediction` directly with the frozen five-point
trend window. Server-owned current UTC time is the prediction origin and the
target is exactly seven days later. Five prior measurements plus the current
measurement are required. Input is copied and sorted.

Stable abstentions are:

- `NO_RECENT_MEASUREMENT`
- `INSUFFICIENT_PRIOR_HISTORY`
- `EXCESSIVE_RECENT_GAP` after the frozen 14-day limit
- `INVALID_MEASUREMENT_HISTORY` for duplicate or future timestamps
- `INTERNAL_PREDICTION_UNAVAILABLE` for a non-finite calculation

No fallback number is returned. V1 has no causally valid production residual
store, so `interval.available` is false with null bounds and an 80% calibration
target. The UI explains that a range needs enough historical prediction errors.

## Backend and BodyMeasurement semantics

Protected endpoints:

- `GET /api/v1/body-weight/prediction`
- `GET /api/v1/body-measurements?page=1&limit=20`
- `POST /api/v1/body-measurements`

Prediction history is capped at the 120 newest rows and only `measuredAt` plus
`weightKg` are sent chronologically to Python. Node applies a configurable
two-second timeout, validates the full response, and maps every service failure
to HTTP 503 with `BODY_WEIGHT_PREDICTION_UNAVAILABLE`. Core API health is not
coupled to this preview.

BodyMeasurement remains the historical source of truth and
`Profile.currentWeightKg` remains a snapshot. A new latest measurement updates
the snapshot in the same transaction; a backdated measurement does not. Exact
user/timestamp duplicates return 409. Weight is limited to 30–350 kg, future
dates are rejected, retrieval is paginated and bounded, and ownership comes
only from authentication. No migration, cache, or prediction write was added.
Dashboard behavior remains latest BodyMeasurement then profile fallback.

## Frontend, accessibility, and localization

`/app/weights` remains the exercise-resistance Weight Tracker. A clearly labeled
card links to `/app/weights/body-weight`, keeping body weight distinct without a
new primary navigation item. The page includes minimal logging, recent history,
an observed chart, a distinct dashed forecast point when available, textual
chart summary, and loading/error/abstention states. It refreshes history and
prediction after saving and stores neither in localStorage.

Visible copy says Research Preview, experimental, not guaranteed, and not
medical advice. Status does not depend on color, units appear in accessible
labels, form errors use alert semantics, and the chart has accompanying text.
English and natural Arabic use a dedicated `bodyWeight` namespace. Logical
layout supports RTL; chart chronology stays left-to-right so time direction
remains correct.

## Privacy and security

Python receives only timestamps and weights—never IDs, names, email, role,
profile fields, tokens, notes, workouts, or nutrition. Arrays are not logged.
FastAPI has no CORS middleware, disables documentation routes, rejects declared
bodies over 32 KiB, and accepts at most 120 measurements. The documented service
bind is `127.0.0.1`. Node configuration is environment-owned:

```dotenv
BODY_WEIGHT_PREDICTION_SERVICE_URL=http://127.0.0.1:8001
BODY_WEIGHT_PREDICTION_TIMEOUT_MS=2000
```

## Windows 10 startup

One-time installation:

```powershell
cd "C:\MetaForm GYM\data-science"
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
```

Terminal 1:

```powershell
cd "C:\MetaForm GYM"
npm run dev:prediction
```

Terminal 2:

```powershell
cd "C:\MetaForm GYM"
npm run dev
```

`npm run dev:all` optionally starts all three processes. Docker, AWS, OpenAI,
notebook execution, and training are not required.

## Tests and local smoke path

Python tests cover Recent Trend reuse/regression, horizon, eligibility and gap
gates, invalid history, numeric output, no interval fabrication, immutability,
schema bounds, health, and malformed requests. Backend tests cover auth,
ownership, validation, pagination, duplicates, snapshot behavior, minimized
payload, AVAILABLE/ABSTAINED, timeout/5xx/malformed responses, and safe errors.
Frontend tests cover loading, metrics, labeling, abstention, unavailable
intervals, disclaimer, service failure, form refresh, English/Arabic, RTL,
chronology, accessibility, and no client storage.

Local smoke:

1. Start PostgreSQL, prediction service, API, and web.
2. Sign in and open `/app/weights/body-weight`.
3. With no history, confirm a safe abstention.
4. Add measurements and confirm history and forecast refresh.
5. With six sufficiently recent measurements, confirm an AVAILABLE
   `RECENT_TREND` result with no interval bounds.
6. Stop FastAPI and confirm only the preview shows a localized unavailable state.

## Limitations and next stage

Normal short-term body-weight variation can dominate the trend, production
interval calibration is absent, and multi-user generalization is unproven. Ridge
promotion can be considered only after genuine longitudinal evidence passes the
unchanged protocol and Ridge passes the frozen promotion/stability gates. The
next stage is real-data evidence accumulation and observed preview monitoring,
not Strength Progression Modeling or broader automation.
