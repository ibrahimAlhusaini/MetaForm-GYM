from __future__ import annotations

from dataclasses import replace

from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.protocol import (
    EvidenceThresholds,
    FrozenWeightEvidenceProtocol,
)


def test_protocol_serialization_and_hash_are_deterministic() -> None:
    first = FrozenWeightEvidenceProtocol()
    second = FrozenWeightEvidenceProtocol()
    assert first.canonical_json() == second.canonical_json()
    assert first.protocol_hash == second.protocol_hash
    assert len(first.protocol_hash) == 64


def test_config_change_alters_protocol_hash() -> None:
    original = FrozenWeightEvidenceProtocol()
    changed = FrozenWeightEvidenceProtocol(
        model_config=replace(original.model_config, ridge_alpha=2.0)
    )
    assert original.protocol_hash != changed.protocol_hash


def test_protocol_contains_no_runtime_secrets() -> None:
    serialized = FrozenWeightEvidenceProtocol().canonical_json().lower()
    assert "database_url" not in serialized
    assert "password" not in serialized
    assert "anonymization" not in serialized
    assert "executed_at" not in serialized


def test_frozen_defaults_regression() -> None:
    config = WeightModelConfig()
    assert config.forecast_horizon_days == 7
    assert config.target_tolerance_days == 2
    assert config.minimum_prior_measurements == 5
    assert config.rolling_short_window == 3
    assert config.rolling_long_window == 5
    assert config.trend_window == 5
    assert config.ridge_alpha == 1.0
    assert config.meaningful_improvement_percent == 5.0
    assert config.minimum_selection_predictions == 10
    assert EvidenceThresholds() == EvidenceThresholds(
        minimum_total_predictions=30,
        minimum_eligible_users=3,
        minimum_users_with_multiple_predictions=2,
        predictions_per_repeated_user=3,
        minimum_temporal_span_days=60,
        minimum_cadence_bucket_coverage=2,
        minimum_history_bucket_coverage=2,
    )


def test_sensitivity_values_do_not_mutate_defaults() -> None:
    before = WeightModelConfig()
    _ = replace(before, minimum_prior_measurements=7, target_tolerance_days=1)
    assert WeightModelConfig() == before
