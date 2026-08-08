from __future__ import annotations

from dataclasses import replace
from unittest.mock import MagicMock

import pandas as pd
import pytest

from metaform_ds.modeling.strength.config import StrengthModelConfig
from metaform_ds.modeling.strength.evidence import (
    classify_strength_scope,
    evaluate_strength_evidence_frame,
    summarize_strength_quality,
    unavailable_strength_evidence_result,
)
from metaform_ds.modeling.strength.evidence_reports import (
    render_strength_real_evidence_report,
)
from metaform_ds.modeling.strength.protocol import (
    FrozenStrengthEvidenceProtocol,
    StrengthEvidenceThresholds,
)
from metaform_ds.utils.synthetic import generate_synthetic_datasets


def _realish() -> pd.DataFrame:
    frame = generate_synthetic_datasets(71).strength.copy(deep=True)
    frame.attrs.clear()
    return frame


def _permissive() -> FrozenStrengthEvidenceProtocol:
    return FrozenStrengthEvidenceProtocol(
        evidence_thresholds=StrengthEvidenceThresholds(
            minimum_total_predictions=1,
            minimum_personal_users=1,
            minimum_multi_user_count=2,
            minimum_eligible_sources=1,
            minimum_sources_with_three_predictions=1,
            minimum_temporal_folds=1,
            minimum_temporal_span_days=1,
            minimum_history_bucket_coverage=1,
        )
    )


def test_protocol_serialization_and_hash_are_stable() -> None:
    first = FrozenStrengthEvidenceProtocol()
    second = FrozenStrengthEvidenceProtocol()
    assert first.canonical_json() == second.canonical_json()
    assert first.protocol_hash == second.protocol_hash
    assert (
        first.protocol_hash
        == "f5bc7c9468962026594556fdb9877c35e8cfaa98577b2cbab39d8aff08d32a40"
    )


def test_config_change_changes_hash_and_protocol_has_no_secrets() -> None:
    original = FrozenStrengthEvidenceProtocol()
    changed = replace(
        original, model_config=replace(original.model_config, ridge_alpha=2.0)
    )
    assert original.protocol_hash != changed.protocol_hash
    serialized = original.canonical_json().lower()
    for forbidden in ("database_url", "password", "secret", "executed_at"):
        assert forbidden not in serialized


def test_candidate_methods_and_frozen_defaults_regression() -> None:
    protocol = FrozenStrengthEvidenceProtocol()
    assert protocol.candidate_methods == (
        "Last Session Baseline",
        "Recent Trend Baseline",
        "Linear Regression",
        "Ridge Regression",
    )
    assert protocol.source_grouping == (
        "ANONYMOUS_USER",
        "SOURCE_TYPE",
        "ANONYMOUS_SOURCE_KEY",
    )
    assert protocol.model_config == StrengthModelConfig(
        model_version="strength-next-session-v1",
        minimum_prior_sessions=4,
        recent_window=3,
        trend_window=4,
        minimum_training_rows=12,
        minimum_sources=2,
        minimum_temporal_folds=3,
        ridge_alpha=1.0,
        meaningful_improvement_percent=5.0,
        minimum_selection_predictions=12,
        maximum_fold_mae_cv=1.0,
        direction_tolerance_kg=0.5,
        cadence_frequent_max_days=7.0,
        cadence_moderate_max_days=14.0,
        minimum_segment_predictions=3,
    )


def test_empty_and_short_data_have_structured_states() -> None:
    empty = evaluate_strength_evidence_frame(pd.DataFrame(), data_origin="REAL")
    assert empty.evidence_state == "NO_REAL_DATA"
    assert empty.evidence_scope == "NO_ELIGIBLE_SCOPE"
    short = _realish().groupby("source_key_anonymous", group_keys=False).head(4)
    result = evaluate_strength_evidence_frame(short, data_origin="REAL")
    assert result.evidence_state == "INSUFFICIENT_STRENGTH_HISTORY"
    assert result.evaluation is None


def test_scope_and_source_coverage_are_aggregate() -> None:
    frame = _realish()
    result = evaluate_strength_evidence_frame(frame, data_origin="REAL")
    assert result.evidence_scope == "PERSONAL_TEMPORAL_VALIDATION"
    assert result.eligibility.eligible_user_count == 2
    assert result.eligibility.eligible_source_count == 4
    assert result.eligibility.exercise_source_count == 2
    assert result.eligibility.custom_machine_source_count == 2
    assert result.eligibility.temporal_span_days > 60
    assert result.eligibility.sources_with_4_sessions == 4
    third = frame.loc[frame["anonymous_user_id"].eq("synthetic_user_001")].copy()
    third["anonymous_user_id"] = "third_anonymous_user"
    third["source_key_anonymous"] += "_third"
    third["session_id_anonymous"] += "_third"
    multi = evaluate_strength_evidence_frame(
        pd.concat([frame, third], ignore_index=True), data_origin="REAL"
    )
    assert multi.evidence_scope == "MULTI_USER_VALIDATION"


def test_exercise_only_custom_only_and_mixed_coverage() -> None:
    frame = _realish()
    exercise = evaluate_strength_evidence_frame(
        frame.loc[frame["source_type"].eq("EXERCISE")], data_origin="REAL"
    )
    custom = evaluate_strength_evidence_frame(
        frame.loc[frame["source_type"].eq("CUSTOM_MACHINE")], data_origin="REAL"
    )
    mixed = evaluate_strength_evidence_frame(frame, data_origin="REAL")
    assert exercise.eligibility.custom_machine_source_count == 0
    assert custom.eligibility.exercise_source_count == 0
    assert mixed.eligibility.exercise_source_count > 0
    assert mixed.eligibility.custom_machine_source_count > 0


def test_quality_surfaces_issues_without_mutating_input() -> None:
    frame = _realish().head(10).copy(deep=True)
    frame.loc[0, "max_weight_kg"] = -1
    frame.loc[1, "max_reps_at_max_weight"] = 0
    frame.loc[2, "session_date"] = pd.NaT
    frame.loc[3, "source_key_anonymous"] = pd.NA
    frame = pd.concat([frame, frame.iloc[[4]]], ignore_index=True)
    original = frame.copy(deep=True)
    summary = summarize_strength_quality(frame)
    assert summary.null_or_non_positive_weights == 1
    assert summary.invalid_reps == 1
    assert summary.invalid_timestamps == 1
    assert summary.missing_source_contract == 1
    assert summary.duplicate_source_session_rows == 2
    assert summary.critical_issue
    pd.testing.assert_frame_equal(frame, original)


def test_missing_contract_and_critical_quality_block_evaluation(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    frame = _realish().drop(columns="source_type")
    evaluation = MagicMock()
    monkeypatch.setattr(
        "metaform_ds.modeling.strength.evidence.evaluate_strength_model", evaluation
    )
    result = evaluate_strength_evidence_frame(frame, data_origin="REAL")
    assert result.quality.missing_contract_columns == 1
    assert result.evidence_state == "INSUFFICIENT_STRENGTH_HISTORY"
    evaluation.assert_not_called()


def test_thresholds_and_reason_codes_are_enforced() -> None:
    result = evaluate_strength_evidence_frame(_realish(), data_origin="REAL")
    assert result.reason_codes
    assert not result.integration_review_allowed
    assert (
        result.reason_codes
        == evaluate_strength_evidence_frame(_realish(), data_origin="REAL").reason_codes
    )


def test_synthetic_blocks_review_and_cannot_be_labeled_real() -> None:
    synthetic = generate_synthetic_datasets(72).strength
    result = evaluate_strength_evidence_frame(
        synthetic, data_origin="SYNTHETIC", protocol=_permissive()
    )
    assert result.evidence_state == "NO_REAL_DATA"
    assert not result.integration_review_allowed
    with pytest.raises(ValueError, match="cannot be labeled"):
        evaluate_strength_evidence_frame(synthetic, data_origin="REAL")


def test_sufficient_real_evidence_may_allow_review(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "metaform_ds.modeling.strength.evidence._stability_passes",
        lambda evaluation: evaluation is not None,
    )
    result = evaluate_strength_evidence_frame(
        _realish(), data_origin="REAL", protocol=_permissive()
    )
    assert result.evidence_state == "SUFFICIENT_FOR_INTEGRATION_REVIEW"
    assert result.integration_review_allowed


def test_unavailable_and_report_are_private_aggregates() -> None:
    unavailable = unavailable_strength_evidence_result()
    assert unavailable.data_origin == "UNAVAILABLE"
    assert unavailable.evidence_state == "NO_REAL_DATA"
    result = evaluate_strength_evidence_frame(
        generate_synthetic_datasets(73).strength,
        data_origin="SYNTHETIC",
    )
    report = render_strength_real_evidence_report(result)
    assert "Data origin: SYNTHETIC" in report
    assert "Protocol hash:" in report
    assert "Integration-review gate" in report
    forbidden = [
        "synthetic_user_001",
        "synthetic_exercise_progressive",
        "source_name",
        "anonymous_user_id",
        "postgresql",
    ]
    assert all(value not in report for value in forbidden)
    assert "actual_next_max_weight_kg" not in report


def test_classify_no_scope() -> None:
    result = unavailable_strength_evidence_result()
    assert (
        classify_strength_scope(result.eligibility, result.protocol)
        == "NO_ELIGIBLE_SCOPE"
    )
