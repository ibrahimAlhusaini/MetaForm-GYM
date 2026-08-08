"""Safe CLI for the frozen real strength evidence protocol."""

from __future__ import annotations

import argparse
import json
from collections.abc import Sequence
from pathlib import Path

from metaform_ds.config import DataScienceConfig
from metaform_ds.db import create_read_only_engine, verify_read_only_connection
from metaform_ds.extraction import extract_strength_progression_dataset
from metaform_ds.modeling.strength.evidence import (
    StrengthEvidenceResult,
    evaluate_strength_evidence_frame,
    unavailable_strength_evidence_result,
)
from metaform_ds.modeling.strength.evidence_reports import (
    render_strength_real_evidence_report,
)
from metaform_ds.modeling.strength.protocol import FrozenStrengthEvidenceProtocol
from metaform_ds.utils.synthetic import generate_synthetic_datasets


class StrengthEvidenceExecutionError(RuntimeError):
    """Sanitized public execution failure."""


def run_real_strength_evidence(
    config: DataScienceConfig | None = None,
    protocol: FrozenStrengthEvidenceProtocol | None = None,
) -> StrengthEvidenceResult:
    settings = config or DataScienceConfig.from_env()
    frozen = protocol or FrozenStrengthEvidenceProtocol()
    if settings.database_url is None:
        return unavailable_strength_evidence_result(frozen)
    try:
        engine = create_read_only_engine(settings)
    except Exception as error:
        raise StrengthEvidenceExecutionError(
            "Configured analytics database setup failed"
        ) from error
    try:
        try:
            verification = verify_read_only_connection(engine)
        except Exception as error:
            raise StrengthEvidenceExecutionError(
                "Configured analytics database connection or read-only "
                "verification failed"
            ) from error
        if not verification.verified:
            raise StrengthEvidenceExecutionError(
                "Configured analytics database did not verify as read-only"
            )
        try:
            frame = extract_strength_progression_dataset(
                engine, secret=settings.anonymization_secret
            )
        except Exception as error:
            raise StrengthEvidenceExecutionError(
                "Read-only strength extraction failed"
            ) from error
    finally:
        engine.dispose()
    return evaluate_strength_evidence_frame(frame, data_origin="REAL", protocol=frozen)


def run_synthetic_strength_protocol_validation(
    config: DataScienceConfig | None = None,
    protocol: FrozenStrengthEvidenceProtocol | None = None,
) -> StrengthEvidenceResult:
    settings = config or DataScienceConfig.from_env()
    frame = generate_synthetic_datasets(settings.synthetic_seed).strength
    return evaluate_strength_evidence_frame(
        frame,
        data_origin="SYNTHETIC",
        protocol=protocol or FrozenStrengthEvidenceProtocol(),
    )


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run the frozen real strength evidence protocol."
    )
    parser.add_argument("--synthetic-validation", action="store_true")
    parser.add_argument("--output", type=Path)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    settings = DataScienceConfig.from_env()
    try:
        result = (
            run_synthetic_strength_protocol_validation(settings)
            if args.synthetic_validation
            else run_real_strength_evidence(settings)
        )
    except StrengthEvidenceExecutionError as error:
        print(json.dumps({"status": "ERROR", "message": str(error)}))
        return 1
    default_name = (
        "strength_synthetic_protocol_validation.md"
        if args.synthetic_validation
        else "strength_real_evidence_v1.md"
    )
    output = args.output or settings.artifact_dir / default_name
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render_strength_real_evidence_report(result), encoding="utf-8")
    print(json.dumps(result.aggregate_summary.to_dict(), sort_keys=True))
    return 2 if result.data_origin == "UNAVAILABLE" else 0


if __name__ == "__main__":
    raise SystemExit(main())
