"""Privacy-safe real strength eligibility, quality, and evidence decisions."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import Literal

import pandas as pd

from metaform_ds.modeling.strength.evaluation import (
    StrengthEvaluationResult,
    evaluate_strength_model,
)
from metaform_ds.modeling.strength.protocol import FrozenStrengthEvidenceProtocol
from metaform_ds.modeling.strength.targets import (
    StrengthTargetResult,
    build_strength_prediction_examples,
)

EvidenceOrigin = Literal["REAL", "SYNTHETIC", "UNAVAILABLE"]
EvidenceScope = Literal[
    "NO_ELIGIBLE_SCOPE",
    "PERSONAL_TEMPORAL_VALIDATION",
    "MULTI_USER_VALIDATION",
]
EvidenceState = Literal[
    "NO_REAL_DATA",
    "INSUFFICIENT_STRENGTH_HISTORY",
    "INSUFFICIENT_SOURCE_COVERAGE",
    "INSUFFICIENT_TEMPORAL_COVERAGE",
    "INSUFFICIENT_USER_DIVERSITY",
    "SUFFICIENT_FOR_METHOD_COMPARISON",
    "SUFFICIENT_FOR_INTEGRATION_REVIEW",
]

REQUIRED_COLUMNS = {
    "anonymous_user_id",
    "session_id_anonymous",
    "session_date",
    "source_type",
    "source_key_anonymous",
    "max_weight_kg",
    "max_reps_at_max_weight",
    "total_volume_kg",
    "working_set_count",
}


@dataclass(frozen=True, slots=True)
class StrengthQualitySummary:
    total_strength_rows: int
    total_completed_sessions: int
    total_weighted_working_sets: int
    missing_contract_columns: int
    null_or_non_positive_weights: int
    invalid_reps: int
    invalid_timestamps: int
    missing_source_contract: int
    duplicate_source_session_rows: int
    chronology_inconsistencies: int
    critical_issue: bool


@dataclass(frozen=True, slots=True)
class StrengthEligibilitySummary:
    total_strength_rows: int
    eligible_user_count: int
    eligible_source_count: int
    exercise_source_count: int
    custom_machine_source_count: int
    first_session_at: str | None
    last_session_at: str | None
    temporal_span_days: int
    sources_with_4_sessions: int
    sources_with_7_sessions: int
    sources_with_11_sessions: int
    eligible_target_examples: int
    expected_temporal_predictions: int
    expected_temporal_folds: int
    sources_with_three_predictions: int
    cadence_buckets_represented: int
    history_buckets_represented: int


@dataclass(frozen=True, slots=True)
class StrengthAggregateEvidenceSummary:
    data_origin: EvidenceOrigin
    protocol_version: str
    protocol_hash: str
    evidence_state: EvidenceState
    evidence_scope: EvidenceScope
    total_strength_rows: int
    eligible_user_count: int
    eligible_source_count: int
    exercise_source_count: int
    custom_machine_source_count: int
    prediction_count: int
    temporal_span_days: int
    temporal_fold_count: int
    preferred_method: str | None
    best_baseline: str | None
    best_ml_candidate: str | None
    ml_improvement_over_best_baseline_pct: float | None
    integration_review_allowed: bool
    reason_codes: tuple[str, ...]
    limitations: tuple[str, ...]

    def to_dict(self) -> dict[str, object]:
        result = asdict(self)
        result["reason_codes"] = list(self.reason_codes)
        result["limitations"] = list(self.limitations)
        return result


@dataclass(frozen=True, slots=True)
class StrengthEvidenceResult:
    data_origin: EvidenceOrigin
    executed_at: str
    protocol: FrozenStrengthEvidenceProtocol
    quality: StrengthQualitySummary
    eligibility: StrengthEligibilitySummary
    evidence_state: EvidenceState
    evidence_scope: EvidenceScope
    integration_review_allowed: bool
    reason_codes: tuple[str, ...]
    limitations: tuple[str, ...]
    evaluation: StrengthEvaluationResult | None
    aggregate_summary: StrengthAggregateEvidenceSummary


def summarize_strength_quality(frame: pd.DataFrame) -> StrengthQualitySummary:
    """Surface contract issues without repairing or mutating input rows."""
    missing = REQUIRED_COLUMNS.difference(frame.columns)
    dates = pd.to_datetime(
        frame.get("session_date", pd.Series(index=frame.index, dtype="object")),
        utc=True,
        errors="coerce",
    )
    weights = pd.to_numeric(
        frame.get("max_weight_kg", pd.Series(index=frame.index, dtype="float64")),
        errors="coerce",
    )
    reps = pd.to_numeric(
        frame.get(
            "max_reps_at_max_weight", pd.Series(index=frame.index, dtype="float64")
        ),
        errors="coerce",
    )
    source_type = frame.get("source_type", pd.Series(index=frame.index, dtype="string"))
    source_key = frame.get(
        "source_key_anonymous", pd.Series(index=frame.index, dtype="string")
    )
    session_key = frame.get(
        "session_id_anonymous", pd.Series(index=frame.index, dtype="string")
    )
    user_key = frame.get(
        "anonymous_user_id", pd.Series(index=frame.index, dtype="string")
    )
    source_missing = int(
        (
            ~source_type.isin(["EXERCISE", "CUSTOM_MACHINE"])
            | source_key.isna()
            | session_key.isna()
            | user_key.isna()
        ).sum()
    )
    duplicate_count = 0
    if not missing.intersection(
        {
            "anonymous_user_id",
            "source_type",
            "source_key_anonymous",
            "session_id_anonymous",
        }
    ):
        duplicate_count = int(
            frame.duplicated(
                [
                    "anonymous_user_id",
                    "source_type",
                    "source_key_anonymous",
                    "session_id_anonymous",
                ],
                keep=False,
            ).sum()
        )
    chronology = 0
    if not missing.intersection(
        {"anonymous_user_id", "source_type", "source_key_anonymous", "session_date"}
    ):
        ordered = frame.assign(_parsed_date=dates)
        for _, group in ordered.groupby(
            ["anonymous_user_id", "source_type", "source_key_anonymous"],
            sort=False,
            dropna=False,
        ):
            chronology += int(
                group["_parsed_date"].diff().dt.total_seconds().lt(0).sum()
            )
    working_sets = pd.to_numeric(
        frame.get("working_set_count", pd.Series(dtype="float64")), errors="coerce"
    ).fillna(0)
    invalid_weight = int((weights.isna() | weights.le(0)).sum())
    invalid_reps = int((reps.isna() | reps.le(0)).sum())
    invalid_dates = int(dates.isna().sum())
    critical = bool(
        missing
        or invalid_weight
        or invalid_reps
        or invalid_dates
        or source_missing
        or duplicate_count
        or chronology
    )
    return StrengthQualitySummary(
        total_strength_rows=len(frame),
        total_completed_sessions=int(session_key.dropna().nunique()),
        total_weighted_working_sets=int(working_sets.clip(lower=0).sum()),
        missing_contract_columns=len(missing),
        null_or_non_positive_weights=invalid_weight,
        invalid_reps=invalid_reps,
        invalid_timestamps=invalid_dates,
        missing_source_contract=source_missing,
        duplicate_source_session_rows=duplicate_count,
        chronology_inconsistencies=chronology,
        critical_issue=critical,
    )


def _expected_predictions(
    examples: pd.DataFrame, protocol: FrozenStrengthEvidenceProtocol
) -> tuple[int, int, int]:
    config = protocol.model_config
    if examples.empty:
        return 0, 0, 0
    source_count = (
        examples[["anonymous_user_id", "source_type", "source_key_anonymous"]]
        .drop_duplicates()
        .shape[0]
    )
    if source_count < config.minimum_sources:
        return 0, 0, 0
    validation_parts: list[pd.DataFrame] = []
    folds = 0
    for origin in examples["prediction_date"].drop_duplicates().sort_values():
        training = examples.loc[
            examples["prediction_date"].lt(origin) & examples["target_date"].lt(origin)
        ]
        if len(training) >= config.minimum_training_rows:
            folds += 1
            validation_parts.append(
                examples.loc[examples["prediction_date"].eq(origin)]
            )
    if folds < config.minimum_temporal_folds:
        return 0, folds, 0
    validation = pd.concat(validation_parts, ignore_index=True)
    repeated_sources = int(
        validation.groupby(["anonymous_user_id", "source_type", "source_key_anonymous"])
        .size()
        .ge(3)
        .sum()
    )
    return len(validation), folds, repeated_sources


def summarize_strength_eligibility(
    frame: pd.DataFrame,
    targets: StrengthTargetResult,
    protocol: FrozenStrengthEvidenceProtocol,
) -> StrengthEligibilitySummary:
    dates = pd.to_datetime(
        frame.get("session_date", pd.Series(dtype="object")), utc=True, errors="coerce"
    ).dropna()
    first = dates.min() if len(dates) else None
    last = dates.max() if len(dates) else None
    span = (
        int((last - first).total_seconds() // 86_400)
        if first is not None and last is not None
        else 0
    )
    group_columns = ["anonymous_user_id", "source_type", "source_key_anonymous"]
    if set(group_columns).issubset(frame.columns):
        source_sizes = frame.dropna(subset=group_columns).groupby(group_columns).size()
    else:
        source_sizes = pd.Series(dtype="int64")
    examples = targets.examples
    expected_predictions, expected_folds, repeated_sources = _expected_predictions(
        examples, protocol
    )
    eligible_sources = (
        examples[group_columns].drop_duplicates()
        if not examples.empty
        else pd.DataFrame(columns=group_columns)
    )
    source_types = (
        eligible_sources["source_type"] if not eligible_sources.empty else pd.Index([])
    )
    cadence = set()
    history = set()
    if not examples.empty:
        cadence_values = pd.to_numeric(examples["recent_cadence_days"], errors="coerce")
        cadence = set(
            pd.cut(
                cadence_values,
                bins=[
                    -float("inf"),
                    protocol.model_config.cadence_frequent_max_days,
                    protocol.model_config.cadence_moderate_max_days,
                    float("inf"),
                ],
                labels=["FREQUENT", "MODERATE", "SPARSE"],
            )
            .dropna()
            .astype(str)
        )
        history = set(
            pd.cut(
                examples["prior_session_count"],
                bins=[3, 6, 10, float("inf")],
                labels=["4_TO_6", "7_TO_10", "11_PLUS"],
            )
            .dropna()
            .astype(str)
        )
    return StrengthEligibilitySummary(
        total_strength_rows=len(frame),
        eligible_user_count=int(examples["anonymous_user_id"].nunique())
        if not examples.empty
        else 0,
        eligible_source_count=int(examples[group_columns].drop_duplicates().shape[0])
        if not examples.empty
        else 0,
        exercise_source_count=int((source_types == "EXERCISE").sum()),
        custom_machine_source_count=int((source_types == "CUSTOM_MACHINE").sum()),
        first_session_at=first.isoformat() if first is not None else None,
        last_session_at=last.isoformat() if last is not None else None,
        temporal_span_days=span,
        sources_with_4_sessions=int(source_sizes.ge(4).sum()),
        sources_with_7_sessions=int(source_sizes.ge(7).sum()),
        sources_with_11_sessions=int(source_sizes.ge(11).sum()),
        eligible_target_examples=len(examples),
        expected_temporal_predictions=expected_predictions,
        expected_temporal_folds=expected_folds,
        sources_with_three_predictions=repeated_sources,
        cadence_buckets_represented=len(cadence),
        history_buckets_represented=len(history),
    )


def classify_strength_scope(
    eligibility: StrengthEligibilitySummary,
    protocol: FrozenStrengthEvidenceProtocol,
) -> EvidenceScope:
    if eligibility.eligible_user_count == 0:
        return "NO_ELIGIBLE_SCOPE"
    if (
        eligibility.eligible_user_count
        >= protocol.evidence_thresholds.minimum_multi_user_count
    ):
        return "MULTI_USER_VALIDATION"
    return "PERSONAL_TEMPORAL_VALIDATION"


def _best_ml(
    evaluation: StrengthEvaluationResult | None,
) -> tuple[str | None, float | None]:
    if (
        evaluation is None
        or evaluation.comparison.empty
        or evaluation.best_baseline is None
    ):
        return None, None
    comparison = evaluation.comparison.set_index("method")
    candidates = comparison.loc[
        comparison.index.intersection(["Linear Regression", "Ridge Regression"])
    ].dropna(subset=["mae_kg"])
    if candidates.empty:
        return None, None
    name = str(candidates["mae_kg"].idxmin())
    baseline_mae = float(str(comparison.loc[evaluation.best_baseline, "mae_kg"]))
    ml_mae = float(str(candidates.loc[name, "mae_kg"]))
    improvement = (baseline_mae - ml_mae) / baseline_mae * 100 if baseline_mae else 0.0
    return name, improvement


def _stability_passes(evaluation: StrengthEvaluationResult | None) -> bool:
    if (
        evaluation is None
        or evaluation.preferred_method is None
        or evaluation.stability.empty
    ):
        return False
    row = evaluation.stability.loc[
        evaluation.stability["method"].eq(evaluation.preferred_method)
    ]
    if row.empty:
        return False
    value = row.iloc[0]["fold_mae_cv"]
    return bool(
        not pd.isna(value) and float(value) <= evaluation.config.maximum_fold_mae_cv
    )


def _decision(
    origin: EvidenceOrigin,
    quality: StrengthQualitySummary,
    eligibility: StrengthEligibilitySummary,
    evaluation: StrengthEvaluationResult | None,
    protocol: FrozenStrengthEvidenceProtocol,
) -> tuple[EvidenceState, bool, tuple[str, ...]]:
    thresholds = protocol.evidence_thresholds
    reasons: list[str] = []
    if origin != "REAL" or quality.total_strength_rows == 0:
        return "NO_REAL_DATA", False, ("REAL_DATA_UNAVAILABLE",)
    if quality.critical_issue:
        reasons.append("CRITICAL_QUALITY_ISSUE")
    if eligibility.eligible_target_examples == 0:
        reasons.append("NO_ELIGIBLE_TARGET_EXAMPLES")
        return "INSUFFICIENT_STRENGTH_HISTORY", False, tuple(reasons)
    if (
        eligibility.eligible_source_count < thresholds.minimum_eligible_sources
        or eligibility.sources_with_three_predictions
        < thresholds.minimum_sources_with_three_predictions
    ):
        reasons.append("MINIMUM_SOURCE_COVERAGE_NOT_MET")
        return "INSUFFICIENT_SOURCE_COVERAGE", False, tuple(reasons)
    prediction_count = 0 if evaluation is None else len(evaluation.predictions)
    fold_count = 0 if evaluation is None else len(evaluation.folds)
    if prediction_count < thresholds.minimum_total_predictions:
        reasons.append("MINIMUM_PREDICTION_COUNT_NOT_MET")
    if fold_count < thresholds.minimum_temporal_folds:
        reasons.append("MINIMUM_TEMPORAL_FOLDS_NOT_MET")
    if eligibility.temporal_span_days < thresholds.minimum_temporal_span_days:
        reasons.append("MINIMUM_TEMPORAL_SPAN_NOT_MET")
    if reasons and any(reason != "CRITICAL_QUALITY_ISSUE" for reason in reasons):
        return "INSUFFICIENT_TEMPORAL_COVERAGE", False, tuple(reasons)
    if (
        eligibility.history_buckets_represented
        < thresholds.minimum_history_bucket_coverage
    ):
        reasons.append("MINIMUM_HISTORY_BUCKET_COVERAGE_NOT_MET")
        return "INSUFFICIENT_SOURCE_COVERAGE", False, tuple(reasons)
    if quality.critical_issue:
        return "SUFFICIENT_FOR_METHOD_COMPARISON", False, tuple(reasons)
    if not _stability_passes(evaluation):
        reasons.append("TEMPORAL_STABILITY_NOT_MET")
        return "SUFFICIENT_FOR_METHOD_COMPARISON", False, tuple(reasons)
    return "SUFFICIENT_FOR_INTEGRATION_REVIEW", True, tuple(reasons)


def evaluate_strength_evidence_frame(
    frame: pd.DataFrame,
    *,
    data_origin: Literal["REAL", "SYNTHETIC"],
    protocol: FrozenStrengthEvidenceProtocol | None = None,
) -> StrengthEvidenceResult:
    frozen = protocol or FrozenStrengthEvidenceProtocol()
    if data_origin == "REAL" and bool(frame.attrs.get("synthetic", False)):
        raise ValueError("Synthetic strength data cannot be labeled as REAL")
    quality = summarize_strength_quality(frame)
    if REQUIRED_COLUMNS.issubset(frame.columns):
        targets = build_strength_prediction_examples(frame, frozen.model_config)
    else:
        targets = StrengthTargetResult(
            examples=pd.DataFrame(),
            eligibility_summary=pd.DataFrame(),
            exclusion_reasons=pd.DataFrame(
                [{"reason": "missing_strength_contract", "count": 1}]
            ),
        )
    eligibility = summarize_strength_eligibility(frame, targets, frozen)
    evaluation = None
    if not quality.critical_issue and eligibility.expected_temporal_predictions > 0:
        evaluation = evaluate_strength_model(
            frame, data_origin=data_origin, config=frozen.model_config
        )
    scope = classify_strength_scope(eligibility, frozen)
    state, allowed, reasons = _decision(
        data_origin, quality, eligibility, evaluation, frozen
    )
    limitations: list[str] = []
    if data_origin != "REAL":
        limitations.append("Synthetic mechanics are not real strength evidence.")
    if scope == "PERSONAL_TEMPORAL_VALIDATION":
        limitations.append(
            "Personal temporal validation does not establish population generalization."
        )
    if eligibility.exercise_source_count == 0:
        limitations.append("Exercise Library sources are not represented.")
    if eligibility.custom_machine_source_count == 0:
        limitations.append("Custom Machine sources are not represented.")
    best_ml, improvement = _best_ml(evaluation)
    prediction_count = 0 if evaluation is None else len(evaluation.predictions)
    fold_count = 0 if evaluation is None else len(evaluation.folds)
    summary = StrengthAggregateEvidenceSummary(
        data_origin=data_origin,
        protocol_version=frozen.protocol_version,
        protocol_hash=frozen.protocol_hash,
        evidence_state=state,
        evidence_scope=scope,
        total_strength_rows=len(frame),
        eligible_user_count=eligibility.eligible_user_count,
        eligible_source_count=eligibility.eligible_source_count,
        exercise_source_count=eligibility.exercise_source_count,
        custom_machine_source_count=eligibility.custom_machine_source_count,
        prediction_count=prediction_count,
        temporal_span_days=eligibility.temporal_span_days,
        temporal_fold_count=fold_count,
        preferred_method=None if evaluation is None else evaluation.preferred_method,
        best_baseline=None if evaluation is None else evaluation.best_baseline,
        best_ml_candidate=best_ml,
        ml_improvement_over_best_baseline_pct=improvement,
        integration_review_allowed=allowed,
        reason_codes=reasons,
        limitations=tuple(limitations),
    )
    return StrengthEvidenceResult(
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
        evaluation=evaluation,
        aggregate_summary=summary,
    )


def unavailable_strength_evidence_result(
    protocol: FrozenStrengthEvidenceProtocol | None = None,
) -> StrengthEvidenceResult:
    frozen = protocol or FrozenStrengthEvidenceProtocol()
    empty = pd.DataFrame()
    limitation = "Real strength evaluation is pending database configuration."
    quality = summarize_strength_quality(empty)
    eligibility = StrengthEligibilitySummary(
        total_strength_rows=0,
        eligible_user_count=0,
        eligible_source_count=0,
        exercise_source_count=0,
        custom_machine_source_count=0,
        first_session_at=None,
        last_session_at=None,
        temporal_span_days=0,
        sources_with_4_sessions=0,
        sources_with_7_sessions=0,
        sources_with_11_sessions=0,
        eligible_target_examples=0,
        expected_temporal_predictions=0,
        expected_temporal_folds=0,
        sources_with_three_predictions=0,
        cadence_buckets_represented=0,
        history_buckets_represented=0,
    )
    summary = StrengthAggregateEvidenceSummary(
        data_origin="UNAVAILABLE",
        protocol_version=frozen.protocol_version,
        protocol_hash=frozen.protocol_hash,
        evidence_state="NO_REAL_DATA",
        evidence_scope="NO_ELIGIBLE_SCOPE",
        total_strength_rows=0,
        eligible_user_count=0,
        eligible_source_count=0,
        exercise_source_count=0,
        custom_machine_source_count=0,
        prediction_count=0,
        temporal_span_days=0,
        temporal_fold_count=0,
        preferred_method=None,
        best_baseline=None,
        best_ml_candidate=None,
        ml_improvement_over_best_baseline_pct=None,
        integration_review_allowed=False,
        reason_codes=("REAL_DATABASE_NOT_CONFIGURED",),
        limitations=(limitation,),
    )
    return StrengthEvidenceResult(
        data_origin="UNAVAILABLE",
        executed_at=datetime.now(UTC).isoformat(),
        protocol=frozen,
        quality=quality,
        eligibility=eligibility,
        evidence_state="NO_REAL_DATA",
        evidence_scope="NO_ELIGIBLE_SCOPE",
        integration_review_allowed=False,
        reason_codes=("REAL_DATABASE_NOT_CONFIGURED",),
        limitations=(limitation,),
        evaluation=None,
        aggregate_summary=summary,
    )
