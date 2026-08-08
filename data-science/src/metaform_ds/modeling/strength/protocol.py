"""Frozen, deterministically fingerprinted strength evidence protocol."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field

from metaform_ds.modeling.strength.config import StrengthModelConfig


@dataclass(frozen=True, slots=True)
class StrengthEvidenceThresholds:
    minimum_total_predictions: int = 30
    minimum_personal_users: int = 1
    minimum_multi_user_count: int = 3
    minimum_eligible_sources: int = 3
    minimum_sources_with_three_predictions: int = 2
    minimum_temporal_folds: int = 5
    minimum_temporal_span_days: int = 60
    minimum_history_bucket_coverage: int = 2

    def __post_init__(self) -> None:
        if any(int(value) <= 0 for value in asdict(self).values()):
            raise ValueError("Strength evidence thresholds must be positive")


@dataclass(frozen=True, slots=True)
class FrozenStrengthEvidenceProtocol:
    protocol_version: str = "strength-evidence-protocol-v1"
    model_config: StrengthModelConfig = field(default_factory=StrengthModelConfig)
    evidence_thresholds: StrengthEvidenceThresholds = field(
        default_factory=StrengthEvidenceThresholds
    )
    target_definition: str = (
        "Representative maximum working weight in the next strictly later "
        "completed session for the same user and strength source."
    )
    candidate_methods: tuple[str, ...] = (
        "Last Session Baseline",
        "Recent Trend Baseline",
        "Linear Regression",
        "Ridge Regression",
    )
    source_grouping: tuple[str, ...] = (
        "ANONYMOUS_USER",
        "SOURCE_TYPE",
        "ANONYMOUS_SOURCE_KEY",
    )

    def to_dict(self) -> dict[str, object]:
        return {
            "candidate_methods": list(self.candidate_methods),
            "evidence_thresholds": asdict(self.evidence_thresholds),
            "model_config": asdict(self.model_config),
            "protocol_version": self.protocol_version,
            "source_grouping": list(self.source_grouping),
            "target_definition": self.target_definition,
        }

    def canonical_json(self) -> str:
        return json.dumps(
            self.to_dict(), sort_keys=True, separators=(",", ":"), ensure_ascii=True
        )

    @property
    def protocol_hash(self) -> str:
        return hashlib.sha256(self.canonical_json().encode("utf-8")).hexdigest()
