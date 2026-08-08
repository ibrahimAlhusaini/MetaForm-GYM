# Strength Progression Modeling V1

## Objective and unit of forecast

V1 predicts one quantity: the representative maximum working weight in the
user's **next completed session for the same strength source**. It does not
forecast an arbitrary date or multiple sessions ahead.

A source is either an Exercise Library exercise or a Custom Machine. Histories
are grouped by anonymous user, source type, and anonymous source key. Sources
are never merged by display name, and Exercise and Custom Machine identities
remain distinct.

## Authoritative strength semantics

The analytical SQL reuses product semantics: completed workout sessions only,
non-warmup sets only, weighted sets only, and one maximum working load per
source/session. Volume is the sum of working-set weight times reps. Standard
exercise muscle/equipment metadata may be used; custom-machine names are null
and never become model features.

For a row at source session `t`, the label is the first same-source session with
a strictly later completion timestamp. Equal timestamps use stable session-key
ordering but cannot label one another. No target is created when no later
session exists.

## Eligibility and features

The centralized `StrengthModelConfig` requires four completed source sessions
before the current prediction session. This prevents one- or two-session model
claims and remains configurable for sensitivity work.

Features are compact and causal:

- current and previous representative maximum;
- source-local session index, elapsed history, and previous-session gap;
- three-session rolling mean/max and recent change;
- three-session past/current volume summaries, working-set count, and reps at
  maximum;
- source type and safe standard exercise muscle/equipment metadata.

Raw user UUIDs, raw source UUIDs, pseudonymous keys, session IDs, source names,
future volume/reps, and future PR state are excluded from the model matrix.

## Baselines and models

The critical Last Session baseline predicts no change. Recent Trend fits a
least-squares slope over recent same-source session indices and projects one
session forward, falling back to Last Session when history is insufficient.
Both permit increases, stability, and decreases.

Pooled Linear and Ridge regressions use identical sklearn pipelines. Numeric
values receive train-fold median imputation; categorical values receive safe
constant imputation and unknown-tolerant one-hot encoding. Ridge alpha is fixed
in configuration. Preprocessing is fit only inside each training fold.

Predictions are clamped only at zero kilograms for physical validity. They are
not forced upward and are not rounded to plate or machine increments.

## Temporal evaluation and leakage controls

Evaluation uses expanding global chronological origins, never a random split.
A training example is visible only when both its prediction timestamp and label
timestamp are strictly before the validation origin. Each example's lag,
rolling, volume, and cadence inputs are constructed solely from its own earlier
same-source history.

Stable timestamp/session ordering, source-local grouping, fold-local fitting,
and target-availability cutoffs prevent future and cross-source leakage.

## Metrics and segments

Primary selection uses MAE in kilograms. RMSE, safe R², prediction count, and
direction accuracy are also reported. Direction is Increase, Stable, or
Decrease using the centralized tolerance.

Aggregate errors are segmented by source type, prior-history length (`4–6`,
`7–10`, `11+`), and past cadence (`FREQUENT`, `MODERATE`, `SPARSE`). Groups below
the configured minimum prediction count are explicitly insufficient.

The best Linear/Ridge candidate is promoted only when it beats the best
baseline by the configured meaningful MAE threshold, has sufficient
predictions, and avoids severe fold instability. A baseline win is a valid and
preferred result.

## Synthetic versus real evidence

The deterministic synthetic fixture contains progressive, stable, noisy, and
deload histories, irregular timing, multiple users/sources, and both source
types. It validates mechanics only. It is never inserted into PostgreSQL or
presented as real-world accuracy.

When `DATA_SCIENCE_DATABASE_URL` is configured, notebook 08 uses the existing
read-only extraction boundary. Synthetic and real rows are never combined.
Reports are aggregate-only and ignored by Git.

## Reproduce

```powershell
cd "C:\MetaForm GYM\data-science"
.\.venv\Scripts\Activate.ps1
ruff check src tests
ruff format --check src tests
mypy src
pytest
jupyter nbconvert --to notebook --execute notebooks\08_strength_progression_model_v1.ipynb --output-dir artifacts
```

## Limitations and integration gate

Sparse histories, irregular training decisions, exercise substitutions,
injury/deload context, and differing machine mechanics are not fully observed.
Synthetic results cannot establish external validity. No model is persisted,
served, or integrated with Node, React, AI Coach, or workout plans.

Product integration is blocked until representative read-only real data yields
sufficient sources, examples, folds, meaningful best-baseline improvement,
acceptable temporal stability, privacy review, and explicit product approval.
