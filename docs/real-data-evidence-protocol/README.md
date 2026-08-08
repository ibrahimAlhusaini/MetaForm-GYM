# Body Weight Real-data Evidence Protocol

## Purpose

This stage accumulates real-world evidence for the existing Body Weight
Prediction V1 without changing the model after seeing real performance. It is a
validation and governance boundary, not a tuning, serving, or application
integration stage.

The protocol is frozen before database extraction because choosing a different
horizon, tolerance, feature, threshold, or model parameter after seeing results
would make the final comparison post-hoc. Sensitivity outputs remain descriptive
and cannot update the defaults in this stage.

## Frozen protocol and fingerprint

`FrozenWeightEvidenceProtocol` uses version
`body-weight-evidence-protocol-v1`. Its canonical, sorted JSON contains the full
`WeightModelConfig`, evidence thresholds, and candidate list. SHA-256 produces a
deterministic `protocol_hash`; runtime timestamps, database configuration, and
secrets are never included.

The frozen model comparison is:

1. Last Value Baseline
2. Recent Trend Baseline
3. Linear Regression
4. Ridge Regression with alpha 1.0

The target remains an observed weight approximately 7 days ahead with a
plus-or-minus 2-day tolerance and at least 5 prior measurements. Existing causal
features, expanding origins, empirical intervals, cadence/history buckets,
stability rules, and model promotion logic remain unchanged. An ML candidate
must still beat Recent Trend by at least 5%, satisfy the existing minimum of 10
selection predictions, and pass temporal stability.

## Pre-registered evidence thresholds

The protocol requires all of the following before broad integration review:

| Requirement | Frozen default |
|---|---:|
| Total temporal predictions | 30 |
| Eligible users | 3 |
| Users with at least 3 predictions | 2 |
| Temporal span | 60 days |
| Meaningful cadence buckets | 2 |
| Meaningful history buckets | 2 |

These thresholds were selected before real performance was available. They must
not be relaxed to make a local database pass.

## Read-only PostgreSQL setup

Only `DATA_SCIENCE_DATABASE_URL` is read. The Python workspace never falls back
to the application `DATABASE_URL`, never prints the configured URL, and never
attempts a write verification.

Use a PostgreSQL role limited to `CONNECT`, schema `USAGE`, and `SELECT` on the
required tables. The code also sets PostgreSQL's default transaction mode to
read-only, begins a read-only transaction, executes `SELECT 1`, confirms
`transaction_read_only=on`, uses explicit SELECT extraction, and rolls back.
Database permissions remain the primary control; runtime verification is a
defense in depth.

Windows PowerShell setup:

```powershell
cd "C:\MetaForm GYM\data-science"
.\.venv\Scripts\Activate.ps1
$env:DATA_SCIENCE_DATABASE_URL = "postgresql+psycopg://readonly_user:<password>@<host>:5432/<database>"
if (Test-Path Env:DATA_SCIENCE_DATABASE_URL) { "Analytics URL is configured" }
python -m metaform_ds.real_evidence
```

The presence check does not echo the credential. A local `.env` may be used only
through an explicitly configured, ignored workflow; this project does not
silently load the Node environment. Never commit a password.

If a configured connection fails, the command returns a sanitized error and does
not fall back to synthetic data. With no configuration it emits a safe pending
summary and exit code 2. Explicit mechanics-only validation is available with:

```powershell
python -m metaform_ds.real_evidence --synthetic-validation
```

## Quality and eligibility gates

The existing non-mutating quality checks summarize missing and non-positive
weights, duplicate timestamps, impossible dates, chronology gaps, usable rows,
and excluded rows. Missing weights, non-positive weights, or impossible dates are
critical evidence blockers. Duplicate timestamps and gaps remain reported
limitations; the protocol does not silently repair, interpolate, or introduce
new exclusion rules.

Eligibility is aggregate only: total measurements, date range and span, users
with 5/10/20 measurements, eligible target examples, expected backtest rows,
users with repeated predictions, and cadence/history bucket coverage. No IDs or
row-level weights enter reports.

## Evidence states and validation scope

The possible states are:

- `NO_REAL_DATA`
- `INSUFFICIENT_LONGITUDINAL_HISTORY`
- `INSUFFICIENT_USER_DIVERSITY`
- `INSUFFICIENT_SEGMENT_COVERAGE`
- `SUFFICIENT_FOR_MODEL_COMPARISON`
- `SUFFICIENT_FOR_INTEGRATION_REVIEW`

The stage intentionally has no `PRODUCTION_READY` state.

One or otherwise under-diverse eligible user is labeled
`PERSONAL_TEMPORAL_VALIDATION`. This permits an honest within-user temporal
portfolio demonstration while explicitly denying population generalization.
Only sufficiently represented multiple users are labeled
`MULTI_USER_VALIDATION`. No fake users are created to satisfy diversity.

## Integration-review gate

`integration_review_allowed` can be true only when the origin is REAL, every
pre-registered evidence threshold passes, sufficient frozen model comparisons
exist, the preferred method passes the existing temporal-stability rule, and no
critical quality issue invalidates analysis. The result permits only a future
human integration review. It does not trigger promotion, persistence, serving,
or application changes.

Recent Trend remains preferred unless an ML candidate passes the unchanged
promotion logic. Weak or baseline-competitive ML results are valid outcomes and
must be reported as such.

## Privacy-safe outputs

The CLI writes ignored aggregate Markdown under `data-science/artifacts/` and
prints an aggregate JSON summary. Outputs contain protocol identifiers, counts,
states, metrics, coverage, recommendation, and limitations. They exclude raw and
anonymous user IDs, row-level measurements or predictions, names, emails,
authentication data, source UUIDs, and database URLs.

Notebook `07_real_data_evidence_protocol.ipynb` shows the frozen protocol before
metrics, REAL availability, quality, eligibility, scope, model comparison,
stability, segment coverage, intervals, and the integration gate. Its separately
labeled SYNTHETIC section validates mechanics only.

## Verification

```powershell
cd "C:\MetaForm GYM\data-science"
ruff check src tests
ruff format --check src tests
mypy src
pytest
python -m metaform_ds.real_evidence
jupyter nbconvert --to notebook --execute notebooks\07_real_data_evidence_protocol.ipynb --output-dir artifacts
```

No model binary, database dump, CSV, Parquet file, or user-specific report is
committed.

## Limitations and next gate

No real evaluation can occur until a SELECT-only PostgreSQL URL is configured
and actual longitudinal measurements exist. A single-user result cannot support
multi-user generalization. Empirical intervals are descriptive and small samples
can be unstable.

The next stage is considered only if this frozen protocol returns
`SUFFICIENT_FOR_INTEGRATION_REVIEW`. That future stage would be a scoped,
human-reviewed prediction integration design; otherwise the next action is to
accumulate more genuine application history and rerun this unchanged protocol.
