# Real-data Strength Evidence Protocol V1

## Purpose and frozen design

This stage validates evidence; it does not tune or serve a model. The frozen
target remains the representative maximum working weight in the next strictly
later completed session for the same anonymous user and exact strength source.
Exercise Library and Custom Machine sources remain distinct.

`strength-evidence-protocol-v1` captures the complete committed Strength V1
configuration, target, four candidate methods, evidence thresholds, and source
grouping semantics. Sorted compact JSON is hashed with SHA-256. Runtime dates,
database configuration, secrets, and performance results are excluded. Any
future target, feature, alpha, threshold, baseline, or selection change requires
a new protocol version and hash.

## Pre-registered evidence thresholds

- 30 evaluated predictions
- 1 eligible user for personal temporal validation
- 3 represented users for multi-user validation
- 3 eligible strength sources
- 2 sources with at least 3 predictions
- 5 temporal folds
- 60 calendar days of strength history
- 2 represented history-length buckets

Both source types are not required for a source-specific claim. If only one type
is present, the report explicitly limits evidence to that type.

## Scope and source coverage

Evidence scope is one of `NO_ELIGIBLE_SCOPE`,
`PERSONAL_TEMPORAL_VALIDATION`, or `MULTI_USER_VALIDATION`. Personal evidence
never establishes population generalization.

Aggregate eligibility reports users, exact sources, Exercise and Custom Machine
source counts, date span, sources reaching 4/7/11 sessions, target examples,
expected predictions/folds, repeated-source coverage, and represented cadence
and history buckets. It never reports source names or identifiers.

## Quality and temporal gates

The existing extraction remains authoritative: completed sessions,
non-warmup weighted sets, and one representative source/session maximum.
Quality checks surface missing contract fields, non-positive loads, invalid
reps/timestamps, missing source identity, duplicate source/session rows, and
chronology inconsistencies without repairing input.

When structurally viable, the unchanged expanding-origin evaluation compares:

1. Last Session Baseline
2. Recent Trend Baseline
3. Linear Regression
4. Ridge Regression

Training prediction and target timestamps must precede validation. Fold-local
preprocessing and same-source causal histories remain unchanged. MAE is primary;
RMSE, safe R², prediction count, descriptive direction accuracy, fold stability,
and aggregate source/history/cadence segments are reported.

## Integration-review gate

`integration_review_allowed` requires REAL origin, acceptable quality,
pre-registered prediction/source/fold/span/history coverage, explicit evidence
scope, and acceptable stability for the frozen preferred method. This permits
only a future review. The protocol never emits `PRODUCTION_READY`, and a
well-supported baseline win is valid.

## Read-only PostgreSQL and privacy

Only `DATA_SCIENCE_DATABASE_URL` is accepted. The CLI never falls back to the
application `DATABASE_URL`. The existing database boundary requires PostgreSQL,
enables transaction read-only mode, verifies it with SELECT statements, runs
only explicit SELECT/CTE SQL, and rolls transactions back.

Reports contain aggregate facts only: no database URL, raw UUID, pseudonymous
key, source name, Custom Machine name, or prediction row. Generated reports stay
ignored under `data-science/artifacts/`.

## Windows workflow

```powershell
cd "C:\MetaForm GYM\data-science"
.\.venv\Scripts\Activate.ps1
$env:DATA_SCIENCE_DATABASE_URL = "postgresql+psycopg://<readonly-user>:<password>@localhost:5432/metaform_gym"
$env:DATA_SCIENCE_ANONYMIZATION_SECRET = "<long-local-secret>"
python -m metaform_ds.strength_evidence
```

The default ignored report is
`artifacts/strength_real_evidence_v1.md`. To validate mechanics without claiming
real evidence:

```powershell
python -m metaform_ds.strength_evidence --synthetic-validation
```

Missing configuration returns a safe aggregate `UNAVAILABLE` summary. A
configured connection or read-only verification failure exits safely and never
switches to synthetic data.

## Limitations and next decision gate

Personal histories cannot establish multi-user generalization. Missing source
types constrain claims. Training intent, injuries, deload rationale, equipment
differences, and substitutions remain partially unobserved.

The next stage is product integration review only if the frozen protocol returns
`SUFFICIENT_FOR_INTEGRATION_REVIEW`. Otherwise the next action is additional
read-only evidence accumulation under the unchanged protocol.
