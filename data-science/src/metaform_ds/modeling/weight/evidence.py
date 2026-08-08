"""Aggregate-only eligibility, quality, and real-evidence decision logic."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal

import pandas as pd

from metaform_ds.modeling.weight.protocol import FrozenWeightEvidenceProtocol
from metaform_ds.modeling.weight.robustness import (
    WeightRobustnessResult,
    evaluate_weight_robustness,
)
from metaform_ds.modeling.weight.segments import cadence_bucket, history_bucket
from metaform_ds.modeling.weight.targets import (
    WeightTargetResult,
    build_weight_prediction_examples,
)
from metaform_ds.quality import QualityReport, build_quality_report

EvidenceDataOrigin = Literal["REAL", "SYNTHETIC", "UNAVAILABLE"]
EvidenceState = Literal[
    "NO_REAL_DATA",
    "INSUFFICIENT_LONGITUDINAL_HISTORY",
    "INSUFFICIENT_USER_DIVERSITY",
    "INSUFFICIENT_SEGMENT_COVERAGE",
    "SUFFICIENT_FOR_MODEL_COMPARISON",
    "SUFFICIENT_FOR_INTEGRATION_REVIEW",
]
EvidenceScope = Literal[
    "NO_ELIGIBLE_SCOPE",
    "PERSONAL_TEMPORAL_VALIDATION",
    "MULTI_USER_VALIDATION",
]


@dataclass(frozen=True, slots=True)
class BodyWeightQualitySummary:
    total_measurements: int
    missing_weight_values: int
    invalid_non_positive_weights: int
    duplicate_timestamps: int
    impossible_dates: int
    chronology_gaps: int
    usable_measurements: int
    excluded_measurements: int
    critical_issue: bool


@dataclass(frozen=True, slots=True)
class RealDataEligibilitySummary:
    total_measurements: int
    eligible_user_count: int
    first_measurement_at: str | None
    last_measurement_at: str | None
    temporal_span_days: int
    users_with_5_measurements: int
    users_with_10_measurements: int
    users_with_20_measurements: int
    eligible_target_examples: int
    expected_temporal_evaluation_rows: int
    users_with_multiple_predictions: int
    cadence_buckets_represented: int
    history_buckets_represented: int


@dataclass(frozen=True, slots=True)
class AggregateEvidenceSummary:
    data_origin: EvidenceDataOrigin
    protocol_version: str
    protocol_hash: str
    evidence_state: EvidenceState
    evidence_scope: EvidenceScope
    total_measurements: int
    eligible_user_count: int
    prediction_count: int
    temporal_span_days: int
    preferred_method: str | None
    best_baseline: str | None
    best_ml_candidate: str | None
    ml_improvement_over_best_baseline_pct: float | None
    interval_coverage: float | None
    integration_review_allowed: bool
    reason_codes: tuple[str, ...]
    limitations: tuple[str, ...]

    def to_dict(self) -> dict[str, object]:
        return {
            "data_origin": self.data_origin,
            "protocol_version": self.protocol_version,
            "protocol_hash": self.protocol_hash,
            "evidence_state": self.evidence_state,
            "evidence_scope": self.evidence_scope,
            "total_measurements": self.total_measurements,
            "eligible_user_count": self.eligible_user_count,
            "prediction_count": self.prediction_count,
            "temporal_span_days": self.temporal_span_days,
            "preferred_method": self.preferred_method,
            "best_baseline": self.best_baseline,
            "best_ml_candidate": self.best_ml_candidate,
            "ml_improvement_over_best_baseline_pct": (
                self.ml_improvement_over_best_baseline_pct
            ),
            "interval_coverage": self.interval_coverage,
            "integration_review_allowed": self.integration_review_allowed,
            "reason_codes": list(self.reason_codes),
            "limitations": list(self.limitations),
        }


@dataclass(frozen=True, slots=True)
class RealEvidenceResult:
    data_origin: EvidenceDataOrigin
    executed_at: str
    protocol: FrozenWeightEvidenceProtocol
    quality: BodyWeightQualitySummary
    eligibility: RealDataEligibilitySummary
    evidence_state: EvidenceState
    evidence_scope: EvidenceScope
    integration_review_allowed: bool
    reason_codes: tuple[str, ...]
    limitations: tuple[str, ...]
    robustness: WeightRobustnessResult | None
    aggregate_summary: AggregateEvidenceSummary


def _issue_count(report: QualityReport, code: str) -> int:
    matches = report.issues.loc[report.issues["code"].eq(code), "count"]
    return int(matches.sum()) if not matches.empty else 0


def summarize_body_weight_quality(
    frame: pd.DataFrame,
) -> tuple[BodyWeightQualitySummary, QualityReport]:
    """Summarize existing checks without changing or repairing the input frame."""
    report = build_quality_report(
        frame,
        dataset_name="body_weight",
        timestamp_column="measured_at",
        duplicate_timestamp_keys=["anonymous_user_id", "measured_at"],
        minimum_observations=5,
    )
    missing_weight = (
        int(frame["weight_kg"].isna().sum()) if "weight_kg" in frame else len(frame)
    )
    numeric_weight = pd.to_numeric(
        frame.get("weight_kg", pd.Series(dtype="float64")), errors="coerce"
    )
    invalid_weight = int(numeric_weight.le(0).sum())
    dates = pd.to_datetime(
        frame.get("measured_at", pd.Series(dtype="datetime64[ns, UTC]")),
        utc=True,
        errors="coerce",
    )
    valid = (
        frame.get("anonymous_user_id", pd.Series(index=frame.index, dtype="string"))
        .notna()
        .to_numpy()
        & dates.notna().to_numpy()
        & numeric_weight.gt(0).fillna(False).to_numpy()
    )
    impossible_dates = _issue_count(report, "impossible_dates")
    summary = BodyWeightQualitySummary(
        total_measurements=len(frame),
        missing_weight_values=missing_weight,
        invalid_non_positive_weights=invalid_weight,
        duplicate_timestamps=_issue_count(report, "duplicate_timestamps"),
        impossible_dates=impossible_dates,
        chronology_gaps=_issue_count(report, "chronology_gaps"),
        usable_measurements=int(valid.sum()),
        excluded_measurements=int((~valid).sum()),
        critical_issue=missing_weight > 0 or invalid_weight > 0 or impossible_dates > 0,
    )
    return summary, report


def _expected_temporal_rows(examples: pd.DataFrame, minimum_training_rows: int) -> int:
    if examples.empty:
        return 0
    ordered = examples.sort_values("prediction_date", kind="stable")
    total = 0
    for origin in ordered["prediction_date"].drop_duplicates().sort_values():
        available = ordered.loc[
            ordered["prediction_date"].lt(origin) & ordered["target_date"].lt(origin)
        ]
        if len(available) >= minimum_training_rows:
            total += int(ordered["prediction_date"].eq(origin).sum())
    return total


def summarize_real_data_eligibility(
    frame: pd.DataFrame,
    targets: WeightTargetResult,
    protocol: FrozenWeightEvidenceProtocol,
) -> RealDataEligibilitySummary:
    """Build privacy-safe aggregate eligibility facts before viewing metrics."""
    settings = protocol.model_config
    valid_dates = pd.to_datetime(
        frame.get("measured_at", pd.Series(dtype="datetime64[ns, UTC]")),
        utc=True,
        errors="coerce",
    ).dropna()
    first = valid_dates.min() if len(valid_dates) else None
    last = valid_dates.max() if len(valid_dates) else None
    span = (
        int((last - first).total_seconds() // 86_400)
        if first is not None and last is not None
        else 0
    )
    counts = (
        frame.dropna(subset=["anonymous_user_id"])
        .groupby("anonymous_user_id", dropna=False)
        .size()
        if "anonymous_user_id" in frame
        else pd.Series(dtype="int64")
    )
    examples = targets.examples
    prediction_counts = (
        examples.groupby("anonymous_user_id").size()
        if not examples.empty
        else pd.Series(dtype="int64")
    )
    cadence = {
        cadence_bucket(float(value), settings)
        for value in examples.get(
            "recent_measurement_cadence_days", pd.Series(dtype="float64")
        ).dropna()
    }
    history = {
        history_bucket(int(value), settings)
        for value in examples.get(
            "prior_measurement_count", pd.Series(dtype="int64")
        ).dropna()
    }
    repeated_threshold = protocol.evidence_thresholds.predictions_per_repeated_user
    return RealDataEligibilitySummary(
        total_measurements=len(frame),
        eligible_user_count=int(examples["anonymous_user_id"].nunique()),
        first_measurement_at=first.isoformat() if first is not None else None,
        last_measurement_at=last.isoformat() if last is not None else None,
        temporal_span_days=span,
        users_with_5_measurements=int(counts.ge(5).sum()),
        users_with_10_measurements=int(counts.ge(10).sum()),
        users_with_20_measurements=int(counts.ge(20).sum()),
        eligible_target_examples=len(examples),
        expected_temporal_evaluation_rows=_expected_temporal_rows(
            examples, settings.minimum_training_rows
        ),
        users_with_multiple_predictions=int(
            prediction_counts.ge(repeated_threshold).sum()
        ),
        cadence_buckets_represented=len(cadence),
        history_buckets_represented=len(history),
    )


def classify_evidence_scope(
    eligibility: RealDataEligibilitySummary,
    protocol: FrozenWeightEvidenceProtocol,
) -> EvidenceScope:
    if eligibility.eligible_user_count == 0:
        return "NO_ELIGIBLE_SCOPE"
    thresholds = protocol.evidence_thresholds
    if (
        eligibility.eligible_user_count >= thresholds.minimum_eligible_users
        and eligibility.users_with_multiple_predictions
        >= thresholds.minimum_users_with_multiple_predictions
    ):
        return "MULTI_USER_VALIDATION"
    return "PERSONAL_TEMPORAL_VALIDATION"


def _best_candidates(
    robustness: WeightRobustnessResult | None,
) -> tuple[str | None, str | None, float | None]:
    if robustness is None or robustness.comparison.empty:
        return None, None, None
    comparison = robustness.comparison.set_index("model")
    baselines = comparison.loc[
        comparison.index.intersection(["Last Value Baseline", "Recent Trend Baseline"])
    ].dropna(subset=["mae_kg"])
    models = comparison.loc[
        comparison.index.intersection(["Linear Regression", "Ridge Regression"])
    ].dropna(subset=["mae_kg"])
    best_baseline = str(baselines["mae_kg"].idxmin()) if len(baselines) else None
    best_ml = str(models["mae_kg"].idxmin()) if len(models) else None
    if best_baseline is None or best_ml is None:
        return best_baseline, best_ml, None
    baseline_mae = float(str(baselines.loc[best_baseline, "mae_kg"]))
    ml_mae = float(str(models.loc[best_ml, "mae_kg"]))
    improvement = (baseline_mae - ml_mae) / baseline_mae * 100 if baseline_mae else 0.0
    return best_baseline, best_ml, improvement


def _interval_coverage(robustness: WeightRobustnessResult | None) -> float | None:
    if robustness is None or robustness.interval_diagnostics.empty:
        return None
    selected = robustness.interval_diagnostics.loc[
        robustness.interval_diagnostics["model"].eq(robustness.preferred_method)
    ]
    if selected.empty or pd.isna(selected.iloc[0]["empirical_coverage_rate"]):
        return None
    return float(selected.iloc[0]["empirical_coverage_rate"])


def _stability_acceptable(robustness: WeightRobustnessResult | None) -> bool:
    if robustness is None or robustness.stability.empty:
        return False
    selected = robustness.stability.loc[
        robustness.stability["model"].eq(robustness.preferred_method)
    ]
    if selected.empty:
        return False
    value = selected.iloc[0]["fold_mae_cv"]
    return bool(
        not pd.isna(value) and float(value) <= robustness.config.maximum_fold_mae_cv
    )


def _decision(
    *,
    data_origin: EvidenceDataOrigin,
    quality: BodyWeightQualitySummary,
    eligibility: RealDataEligibilitySummary,
    robustness: WeightRobustnessResult | None,
    protocol: FrozenWeightEvidenceProtocol,
) -> tuple[EvidenceState, bool, tuple[str, ...]]:
    thresholds = protocol.evidence_thresholds
    reasons: list[str] = []
    if data_origin != "REAL" or eligibility.total_measurements == 0:
        reasons.append("REAL_DATA_UNAVAILABLE")
        return "NO_REAL_DATA", False, tuple(reasons)
    if quality.critical_issue:
        reasons.append("CRITICAL_QUALITY_ISSUE")
    prediction_count = 0 if robustness is None else len(robustness.predictions)
    if prediction_count < thresholds.minimum_total_predictions:
        reasons.append("MINIMUM_PREDICTION_COUNT_NOT_MET")
    if eligibility.temporal_span_days < thresholds.minimum_temporal_span_days:
        reasons.append("MINIMUM_TEMPORAL_SPAN_NOT_MET")
    if robustness is None or prediction_count == 0:
        reasons.append("LONGITUDINAL_EVALUATION_UNAVAILABLE")
    longitudinal_failed = any(
        reason
        in {
            "MINIMUM_PREDICTION_COUNT_NOT_MET",
            "MINIMUM_TEMPORAL_SPAN_NOT_MET",
            "LONGITUDINAL_EVALUATION_UNAVAILABLE",
        }
        for reason in reasons
    )
    if longitudinal_failed:
        return "INSUFFICIENT_LONGITUDINAL_HISTORY", False, tuple(reasons)
    if (
        eligibility.eligible_user_count < thresholds.minimum_eligible_users
        or eligibility.users_with_multiple_predictions
        < thresholds.minimum_users_with_multiple_predictions
    ):
        reasons.append("MINIMUM_USER_DIVERSITY_NOT_MET")
        return "INSUFFICIENT_USER_DIVERSITY", False, tuple(reasons)
    if (
        eligibility.cadence_buckets_represented
        < thresholds.minimum_cadence_bucket_coverage
        or eligibility.history_buckets_represented
        < thresholds.minimum_history_bucket_coverage
    ):
        reasons.append("MINIMUM_SEGMENT_COVERAGE_NOT_MET")
        return "INSUFFICIENT_SEGMENT_COVERAGE", False, tuple(reasons)
    if quality.critical_issue:
        return "SUFFICIENT_FOR_MODEL_COMPARISON", False, tuple(reasons)
    if not _stability_acceptable(robustness):
        reasons.append("TEMPORAL_STABILITY_NOT_MET")
        return "SUFFICIENT_FOR_MODEL_COMPARISON", False, tuple(reasons)
    return "SUFFICIENT_FOR_INTEGRATION_REVIEW", True, tuple(reasons)


def evaluate_evidence_frame(
    frame: pd.DataFrame,
    *,
    data_origin: Literal["REAL", "SYNTHETIC"],
    protocol: FrozenWeightEvidenceProtocol | None = None,
) -> RealEvidenceResult:
    """Run quality and eligibility before the unchanged robustness evaluation."""
    frozen = protocol or FrozenWeightEvidenceProtocol()
    if data_origin == "REAL" and bool(frame.attrs.get("synthetic", False)):
        raise ValueError("Synthetic data cannot be labeled as REAL")
    quality, _ = summarize_body_weight_quality(frame)
    targets = build_weight_prediction_examples(frame, frozen.model_config)
    eligibility = summarize_real_data_eligibility(frame, targets, frozen)
    robustness = None
    if not quality.critical_issue and eligibility.expected_temporal_evaluation_rows > 0:
        robustness = evaluate_weight_robustness(
            frame, data_origin=data_origin, config=frozen.model_config
        )
    scope = classify_evidence_scope(eligibility, frozen)
    state, allowed, reasons = _decision(
        data_origin=data_origin,
        quality=quality,
        eligibility=eligibility,
        robustness=robustness,
        protocol=frozen,
    )
    limitations: list[str] = []
    if data_origin != "REAL":
        limitations.append("Synthetic validation is pipeline evidence, not real data.")
    if scope == "PERSONAL_TEMPORAL_VALIDATION":
        limitations.append("Results do not establish generalization to other users.")
    if quality.duplicate_timestamps:
        limitations.append("Duplicate measurement timestamps require source review.")
    if quality.chronology_gaps:
        limitations.append("Long chronology gaps limit temporal interpretation.")
    best_baseline, best_ml, improvement = _best_candidates(robustness)
    prediction_count = 0 if robustness is None else len(robustness.predictions)
    aggregate = AggregateEvidenceSummary(
        data_origin=data_origin,
        protocol_version=frozen.protocol_version,
        protocol_hash=frozen.protocol_hash,
        evidence_state=state,
        evidence_scope=scope,
        total_measurements=eligibility.total_measurements,
        eligible_user_count=eligibility.eligible_user_count,
        prediction_count=prediction_count,
        temporal_span_days=eligibility.temporal_span_days,
        preferred_method=(None if robustness is None else robustness.preferred_method),
        best_baseline=best_baseline,
        best_ml_candidate=best_ml,
        ml_improvement_over_best_baseline_pct=improvement,
        interval_coverage=_interval_coverage(robustness),
        integration_review_allowed=allowed,
        reason_codes=reasons,
        limitations=tuple(limitations),
    )
    return RealEvidenceResult(
        data_origin=data_origin,
        executed_at=datetime.now(UTC).isoformat(),
        protocol=frozen,
        quality=quality,
        eligibility=eligibility,
        evidence_state=state,
        evidence_scope=scope,
        integration_review_allowed=allowed,
        reason_codes=reasons,
        limitations=tuple(limitations),
        robustness=robustness,
        aggregate_summary=aggregate,
    )


def unavailable_evidence_result(
    protocol: FrozenWeightEvidenceProtocol | None = None,
) -> RealEvidenceResult:
    """Represent missing DB configuration without inventing real observations."""
    empty = pd.DataFrame(columns=["anonymous_user_id", "measured_at", "weight_kg"])
    frozen = protocol or FrozenWeightEvidenceProtocol()
    quality, _ = summarize_body_weight_quality(empty)
    targets = build_weight_prediction_examples(empty, frozen.model_config)
    eligibility = summarize_real_data_eligibility(empty, targets, frozen)
    reasons = ("REAL_DATABASE_NOT_CONFIGURED",)
    limitations = ("Real-data evaluation is pending database configuration.",)
    aggregate = AggregateEvidenceSummary(
        data_origin="UNAVAILABLE",
        protocol_version=frozen.protocol_version,
        protocol_hash=frozen.protocol_hash,
        evidence_state="NO_REAL_DATA",
        evidence_scope="NO_ELIGIBLE_SCOPE",
        total_measurements=0,
        eligible_user_count=0,
        prediction_count=0,
        temporal_span_days=0,
        preferred_method=None,
        best_baseline=None,
        best_ml_candidate=None,
        ml_improvement_over_best_baseline_pct=None,
        interval_coverage=None,
        integration_review_allowed=False,
        reason_codes=reasons,
        limitations=limitations,
    )
    return RealEvidenceResult(
        data_origin="UNAVAILABLE",
        executed_at=datetime.now(UTC).isoformat(),
        protocol=frozen,
        quality=quality,
        eligibility=eligibility,
        evidence_state="NO_REAL_DATA",
        evidence_scope="NO_ELIGIBLE_SCOPE",
        integration_review_allowed=False,
        reason_codes=reasons,
        limitations=limitations,
        robustness=None,
        aggregate_summary=aggregate,
    )
