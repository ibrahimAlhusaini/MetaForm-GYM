# Strength Progression Product Integration V1

## Status and decision

This feature is a **Research Preview** for the next completed same-source
session. Strength V1 evaluated Last Session, Recent Trend, pooled Linear
Regression, and Ridge. Linear and Ridge did not beat the promotion criteria, so
the live method is the simpler `LAST_SESSION` baseline. This is an
evidence-driven non-promotion decision, not a claim of machine-learning
superiority.

The estimate is the latest completed working maximum carried forward as a
conservative reference. It is not an exact set prescription, guaranteed
progression, automatic progressive overload, or medical guidance. The frozen
Strength V1 model and `strength-evidence-protocol-v1` remain unchanged.

## Architecture

```text
React source-history page
  -> authenticated Express endpoint
  -> source authorization and bounded PostgreSQL history query
  -> minimized chronological session maxima
  -> shared FastAPI prediction process
  -> authoritative Python Last Session baseline
  -> AVAILABLE or ABSTAINED response
```

No notebook, training, model persistence, database write, workout mutation, PR
mutation, or AI Coach integration occurs on this path.

## Contracts and routes

The public endpoint is:

```text
GET /api/v1/weight-tracker/sources/:sourceType/:sourceId/strength-prediction
```

`sourceType` follows existing Weight Tracker URLs: `exercise` or `machine`.
The internal Python endpoint is:

```text
POST /v1/strength/predict
```

Its entire request is an uppercase source type plus at most 30 session objects:

```json
{
  "sourceType": "EXERCISE",
  "sessions": [{ "completedAt": "2026-08-01T12:00:00.000Z", "maxWeightKg": 80 }]
}
```

It deliberately excludes user and source IDs, names, email, JWT, notes, raw
sets, profile, nutrition, and unrelated exercise data. The stable shared result
identifies `RESEARCH_PREVIEW`, `LAST_SESSION`, version
`strength-next-session-v1`, the current and estimated maximums, history summary,
reason codes, and the experimental disclaimer code. There is no fabricated
confidence interval.

## Source semantics and authorization

Node owns authentication, authorization, and PostgreSQL access. Exercise
Library IDs must exist; historical references remain readable if publication
state later changes. A Custom Machine must belong to the authenticated user, and
a cross-user ID returns the same safe 404 as a missing source.

The query is restricted to the exact source and authenticated user, completed
sessions, non-warmup sets, and non-null weights. Each session becomes one
representative maximum using existing Weight Tracker semantics. Results are
ordered newest-first, limited to 30 at the database, then reversed before the
chronological Python request. The bound supports current cadence/reliability
rules without loading unlimited history.

## Availability and abstention

An estimate is available after four prior completed source sessions (five
chronological rows including the current session), provided history is valid and
recent enough. The estimate equals the latest maximum and expected change is
normally zero. Python returns a structured abstention rather than fabricating a
number for:

- `NO_COMPLETED_SOURCE_HISTORY`
- `INSUFFICIENT_SOURCE_HISTORY`
- `EXCESSIVE_RECENT_GAP`
- `INVALID_STRENGTH_HISTORY`
- `INTERNAL_PREDICTION_UNAVAILABLE`

Express maps timeouts, unavailable service responses, and malformed Python
responses to a sanitized 503; raw Python errors are never returned.

## Frontend

The Strength Trend Preview card is embedded in
`/app/weights/history/:sourceType/:sourceId`. It has independent loading, error,
retry, AVAILABLE, and ABSTAINED states, so it does not replace or persist source
history. The visible copy distinguishes an estimate from a workout instruction
and explains recovery, technique, fatigue, equipment, and training-intent
limitations.

English and professional Arabic strings live in a focused
`strengthPrediction` namespace. Global document direction supplies RTL layout
without reversing chronological semantics. The section has a semantic heading,
visible Research Preview label, live status announcements, explicit kilogram
labels, reason text that does not depend on color, and a native retry button.
Only the existing language preference may use local storage; predictions do not.

## Local Windows startup

The existing shared runtime and normal application workflow remain:

```powershell
npm run dev:prediction
npm run dev
```

or:

```powershell
npm run dev:all
```

`BODY_WEIGHT_PREDICTION_SERVICE_URL` remains the backwards-compatible URL for
the shared local FastAPI analytics process; it now hosts both body-weight and
strength routes. The existing `GET /health` remains the service health check and
does not make core Express health depend on an experimental feature.

## Verification

Python coverage checks schema bounds, malformed history, minimum history,
abstention, numeric availability, baseline reuse, non-negative results, and
input immutability. API integration coverage checks auth and ownership, exact
source filtering, completed/non-warmup/non-null semantics, representative maxima,
the 30-session bound, payload minimization, mappings, and sanitized failure
states. Frontend coverage checks the embedded section, eligible and abstained
rendering, reason copy, errors/retry, English/Arabic/RTL, accessibility,
conservative language, and no prediction persistence.

## Limitations and next stage

The method assumes the latest representative maximum is the most defensible
next-session reference. It does not account for planned intensity, equipment
calibration, recovery, technique, fatigue, or changing training intent, and it
has no validated uncertainty calibration. No real application evidence exists
before launch.

The next stage is to accumulate genuine longitudinal data and run the unchanged
`strength-evidence-protocol-v1`. A more complex method may be considered only if
that frozen evidence process supports an integration review and the candidate
beats Last Session under the pre-registered gates. Until then, Linear and Ridge
remain research-only.
