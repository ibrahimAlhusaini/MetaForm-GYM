# Body Weight Model Robustness and Calibration

## Purpose

This evaluation-only stage tests whether the fixed 7-day Body Weight V1 result is
stable across time, cadence, and history length; whether fixed-alpha Ridge helps;
and whether causal empirical uncertainty supports prediction abstention. It does
not tune against synthetic outcomes or integrate predictions into the product.

V1 Linear Regression was not accepted because its deterministic synthetic MAE
was 0.604 kg versus 0.334 kg for Recent Trend. A negative ML result is useful:
it shows why a credible baseline and chronological evaluation are required.

## Methods

The existing expanding-window folds remain authoritative. Training examples must
have prediction and target timestamps strictly before the validation origin.
Diagnostics expose every fold plus EARLY, MIDDLE, and LATE periods. Explicit
calendar cutoffs retain only post-cutoff prediction origins; later observations
cannot change earlier fold training.

Ridge uses the same features, imputers, one-hot encoding, and folds as Linear
Regression with a fixed `alpha=1.0`. There is no hyperparameter search.

Cadence is the median interval among recent measurements available through the
prediction row: HIGH at ≤4 days, MODERATE at >4–7 days, LOW above 7 days, and
UNKNOWN when unavailable. History buckets are 5–7, 8–11, and 12+ prior events.
Small segments are flagged rather than overinterpreted.

## Empirical prediction intervals

For each method and origin, the interval half-width is the configured 80th
percentile of earlier out-of-fold absolute residuals whose targets were already
observed before that origin. At least five residuals are required. Early rows can
therefore have a point prediction but no interval.

These are empirical prediction intervals, not guaranteed confidence intervals.
Observed coverage and mean width are reported; absent intervals yield no
fabricated coverage statistic.

## Abstention and reliability

Point and interval eligibility are separate. Stable reason codes include:

- `INSUFFICIENT_PAST_RESIDUALS` for unavailable intervals;
- `EXCESSIVE_RECENT_GAP` when the latest measurement interval exceeds 14 days;
- target-level `insufficient_prior_history`, `invalid_measurement`, and
  `no_observed_target_in_window` exclusions.

Abstained rows remain in diagnostics. Metadata contains only pseudonymous IDs,
model/version, dates, horizon, prior count, past cadence, interval availability,
origin, and reason codes.

## Selection and sensitivity

Linear or Ridge must beat Recent Trend MAE by at least 5%, have at least ten
predictions, and keep fold-MAE coefficient of variation at or below 1.0. Otherwise
Recent Trend remains preferred. Recommendation states are:

- `INSUFFICIENT_REAL_DATA`
- `BASELINE_PREFERRED`
- `ML_CANDIDATE_PROMISING`
- `READY_FOR_INTEGRATION_EVALUATION`

This stage never emits `PRODUCTION_READY`. Synthetic results always remain
`INSUFFICIENT_REAL_DATA`.

Sensitivity compares minimum history {5, 7, 10} and target tolerance {±1, ±2}
using copied immutable configurations. It reports eligibility, target-offset,
prediction-count, and MAE tradeoffs and never changes defaults automatically.

## Privacy, leakage, and limitations

No raw UUID, name, email, auth data, or user-level report row is exported.
Preprocessing is fold-local. Features, cadence, labels, training rows, and
residual intervals all enforce their own temporal availability boundaries. IID
bootstrap and random cross-validation are prohibited.

Synthetic histories validate mechanics, not accuracy. Small folds cannot support
strong segment or interval claims. Irregular measurement timing and unobserved
hydration/scale effects remain. No model binary or application behavior changes.

## Next decision gate

The next recommended stage is **Real-data Evidence Accumulation and Evaluation
Protocol**: configure the read-only analytics role, collect adequate longitudinal
history, pre-register minimum sample and stability criteria, and rerun this exact
frozen evaluation before considering integration. Strength modeling remains a
separate future project.

