"""Pre-registered and deterministically fingerprinted real-evidence protocol."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field

from metaform_ds.modeling.weight.config import WeightModelConfig


@dataclass(frozen=True, slots=True)
class EvidenceThresholds:
    """Conservative evidence requirements chosen before real evaluation."""

    minimum_total_predictions: int = 30
    minimum_eligible_users: int = 3
    minimum_users_with_multiple_predictions: int = 2
    predictions_per_repeated_user: int = 3
    minimum_temporal_span_days: int = 60
    minimum_cadence_bucket_coverage: int = 2
    minimum_history_bucket_coverage: int = 2

    def __post_init__(self) -> None:
        values = asdict(self)
        invalid = [name for name, value in values.items() if int(value) <= 0]
        if invalid:
            raise ValueError(
                f"Evidence thresholds must be positive: {', '.join(invalid)}"
            )


@dataclass(frozen=True, slots=True)
class FrozenWeightEvidenceProtocol:
    """Immutable protocol whose canonical payload excludes runtime state and secrets."""

    protocol_version: str = "body-weight-evidence-protocol-v1"
    model_config: WeightModelConfig = field(default_factory=WeightModelConfig)
    evidence_thresholds: EvidenceThresholds = field(default_factory=EvidenceThresholds)
    candidate_models: tuple[str, ...] = (
        "Last Value Baseline",
        "Recent Trend Baseline",
        "Linear Regression",
        "Ridge Regression",
    )

    def __post_init__(self) -> None:
        if not self.protocol_version.strip():
            raise ValueError("protocol_version cannot be blank")
        if not self.candidate_models:
            raise ValueError("candidate_models cannot be empty")

    def to_dict(self) -> dict[str, object]:
        """Return the complete stable protocol representation without secrets."""
        return {
            "candidate_models": list(self.candidate_models),
            "evidence_thresholds": asdict(self.evidence_thresholds),
            "model_config": asdict(self.model_config),
            "protocol_version": self.protocol_version,
        }

    def canonical_json(self) -> str:
        """Serialize deterministically; timestamps and runtime values are absent."""
        return json.dumps(
            self.to_dict(), sort_keys=True, separators=(",", ":"), ensure_ascii=True
        )

    @property
    def protocol_hash(self) -> str:
        return hashlib.sha256(self.canonical_json().encode("utf-8")).hexdigest()
