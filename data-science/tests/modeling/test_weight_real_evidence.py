from __future__ import annotations

from dataclasses import replace

import pandas as pd

from metaform_ds.modeling.weight.evidence import (
    classify_evidence_scope,
    evaluate_evidence_frame,
    summarize_body_weight_quality,
    unavailable_evidence_result,
)
from metaform_ds.modeling.weight.evidence_reports import render_real_evidence_report
from metaform_ds.modeling.weight.protocol import (
    EvidenceThresholds,
    FrozenWeightEvidenceProtocol,
)
from metaform_ds.utils.synthetic import generate_synthetic_datasets


def _realish_frame() -> pd.DataFrame:
    frame = generate_synthetic_datasets(123).body_weight.copy(deep=True)
    frame.attrs.clear()
    return frame


def _permissive_protocol() -> FrozenWeightEvidenceProtocol:
    return FrozenWeightEvidenceProtocol(
        evidence_thresholds=EvidenceThresholds(
            minimum_total_predictions=1,
            minimum_eligible_users=1,
            minimum_users_with_multiple_predictions=1,
            predictions_per_repeated_user=1,
            minimum_temporal_span_days=1,
            minimum_cadence_bucket_coverage=1,
            minimum_history_bucket_coverage=1,
        )
    )


def test_empty_real_dataset_is_no_real_data() -> None:
    result = evaluate_evidence_frame(
        pd.DataFrame(columns=["anonymous_user_id", "measured_at", "weight_kg"]),
        data_origin="REAL",
    )
    assert result.evidence_state == "NO_REAL_DATA"
    assert result.evidence_scope == "NO_ELIGIBLE_SCOPE"
    assert not result.integration_review_allowed


def test_too_few_measurements_is_insufficient_history() -> None:
    frame = pd.DataFrame(
        {
            "anonymous_user_id": ["private_analytical_id"] * 4,
            "measured_at": pd.date_range("2026-01-01", periods=4, tz="UTC"),
            "weight_kg": [80.0, 79.9, 79.8, 79.7],
        }
    )
    result = evaluate_evidence_frame(frame, data_origin="REAL")
    assert result.evidence_state == "INSUFFICIENT_LONGITUDINAL_HISTORY"
    assert result.robustness is None


def test_single_user_scope_and_temporal_span_are_aggregate() -> None:
    result = evaluate_evidence_frame(_realish_frame(), data_origin="REAL")
    assert result.evidence_scope == "PERSONAL_TEMPORAL_VALIDATION"
    assert result.eligibility.temporal_span_days > 0
    assert result.eligibility.users_with_5_measurements == 1


def test_multi_user_scope_requires_registered_representation() -> None:
    frame = _realish_frame()
    second = frame.copy(deep=True)
    second["anonymous_user_id"] = "second_analytical_id"
    combined = pd.concat([frame, second], ignore_index=True)
    result = evaluate_evidence_frame(
        combined,
        data_origin="REAL",
        protocol=FrozenWeightEvidenceProtocol(
            evidence_thresholds=replace(
                EvidenceThresholds(),
                minimum_eligible_users=2,
                minimum_users_with_multiple_predictions=2,
            )
        ),
    )
    assert result.evidence_scope == "MULTI_USER_VALIDATION"


def test_prediction_and_segment_thresholds_are_enforced() -> None:
    result = evaluate_evidence_frame(_realish_frame(), data_origin="REAL")
    assert "MINIMUM_PREDICTION_COUNT_NOT_MET" in result.reason_codes
    assert not result.integration_review_allowed


def test_user_diversity_threshold_is_enforced_after_longitudinal_gate() -> None:
    protocol = _permissive_protocol()
    protocol = replace(
        protocol,
        evidence_thresholds=replace(
            protocol.evidence_thresholds,
            minimum_eligible_users=3,
            minimum_users_with_multiple_predictions=2,
        ),
    )
    result = evaluate_evidence_frame(
        _realish_frame(), data_origin="REAL", protocol=protocol
    )
    assert result.evidence_state == "INSUFFICIENT_USER_DIVERSITY"
    assert "MINIMUM_USER_DIVERSITY_NOT_MET" in result.reason_codes


def test_segment_coverage_threshold_is_enforced_after_diversity_gate() -> None:
    protocol = _permissive_protocol()
    protocol = replace(
        protocol,
        evidence_thresholds=replace(
            protocol.evidence_thresholds, minimum_cadence_bucket_coverage=2
        ),
    )
    result = evaluate_evidence_frame(
        _realish_frame(), data_origin="REAL", protocol=protocol
    )
    assert result.evidence_state == "INSUFFICIENT_SEGMENT_COVERAGE"
    assert "MINIMUM_SEGMENT_COVERAGE_NOT_MET" in result.reason_codes


def test_quality_surfaces_invalid_duplicate_and_does_not_mutate() -> None:
    frame = _realish_frame().head(6).copy(deep=True)
    frame.loc[0, "weight_kg"] = -1.0
    frame.loc[1, "measured_at"] = frame.loc[2, "measured_at"]
    original = frame.copy(deep=True)
    summary, report = summarize_body_weight_quality(frame)
    assert summary.invalid_non_positive_weights == 1
    assert summary.duplicate_timestamps == 2
    assert summary.critical_issue
    assert "non_positive_value" in set(report.issues["code"])
    pd.testing.assert_frame_equal(frame, original)


def test_critical_quality_issue_blocks_evaluation_and_review() -> None:
    frame = _realish_frame()
    frame.loc[0, "weight_kg"] = -5
    result = evaluate_evidence_frame(
        frame, data_origin="REAL", protocol=_permissive_protocol()
    )
    assert result.robustness is None
    assert "CRITICAL_QUALITY_ISSUE" in result.reason_codes
    assert not result.integration_review_allowed


def test_sufficient_real_evidence_may_allow_integration_review() -> None:
    result = evaluate_evidence_frame(
        _realish_frame(), data_origin="REAL", protocol=_permissive_protocol()
    )
    assert result.evidence_state == "SUFFICIENT_FOR_INTEGRATION_REVIEW"
    assert result.integration_review_allowed


def test_synthetic_never_allows_integration_or_real_label() -> None:
    result = evaluate_evidence_frame(
        generate_synthetic_datasets(123).body_weight,
        data_origin="SYNTHETIC",
        protocol=_permissive_protocol(),
    )
    assert result.evidence_state == "NO_REAL_DATA"
    assert not result.integration_review_allowed
    assert result.aggregate_summary.data_origin == "SYNTHETIC"


def test_unavailable_result_is_pending_and_private() -> None:
    result = unavailable_evidence_result()
    summary = result.aggregate_summary.to_dict()
    assert result.evidence_state == "NO_REAL_DATA"
    assert result.data_origin == "UNAVAILABLE"
    assert not any("user_id" in key for key in summary)
    assert "REAL_DATABASE_NOT_CONFIGURED" in result.reason_codes


def test_report_contains_aggregates_and_no_row_level_identifiers() -> None:
    result = evaluate_evidence_frame(
        generate_synthetic_datasets(91).body_weight,
        data_origin="SYNTHETIC",
    )
    report = render_real_evidence_report(result)
    assert "Data origin: SYNTHETIC" in report
    assert "Protocol hash:" in report
    assert "Model comparison" in report
    assert "Integration-review gate" in report
    assert "synthetic_user_001" not in report
    assert "anonymous_user_id" not in report
    assert "actual_weight_kg" not in report
    assert "postgresql" not in report.lower()


def test_classify_no_eligible_scope() -> None:
    result = unavailable_evidence_result()
    assert (
        classify_evidence_scope(result.eligibility, result.protocol)
        == "NO_ELIGIBLE_SCOPE"
    )
