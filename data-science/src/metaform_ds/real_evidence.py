"""Thin command-line entry point for the frozen real-evidence protocol."""

from __future__ import annotations

import argparse
import json
from collections.abc import Sequence
from pathlib import Path

from metaform_ds.config import DataScienceConfig
from metaform_ds.db import create_read_only_engine, verify_read_only_connection
from metaform_ds.extraction import extract_body_weight_dataset
from metaform_ds.modeling.weight.evidence import (
    RealEvidenceResult,
    evaluate_evidence_frame,
    unavailable_evidence_result,
)
from metaform_ds.modeling.weight.evidence_reports import render_real_evidence_report
from metaform_ds.modeling.weight.protocol import FrozenWeightEvidenceProtocol
from metaform_ds.utils.synthetic import generate_synthetic_datasets


class RealEvidenceExecutionError(RuntimeError):
    """Safe public failure that never includes connection details."""


def run_real_evidence(
    config: DataScienceConfig | None = None,
    protocol: FrozenWeightEvidenceProtocol | None = None,
) -> RealEvidenceResult:
    """Verify read-only access, extract, then run aggregate real-data evaluation."""
    settings = config or DataScienceConfig.from_env()
    frozen = protocol or FrozenWeightEvidenceProtocol()
    if settings.database_url is None:
        return unavailable_evidence_result(frozen)
    try:
        engine = create_read_only_engine(settings)
    except Exception as error:
        raise RealEvidenceExecutionError(
            "Configured analytics database setup failed"
        ) from error
    try:
        try:
            verification = verify_read_only_connection(engine)
        except Exception as error:
            raise RealEvidenceExecutionError(
                "Configured analytics database connection or read-only "
                "verification failed"
            ) from error
        if not verification.verified:
            raise RealEvidenceExecutionError(
                "Configured analytics database did not verify as read-only"
            )
        try:
            frame = extract_body_weight_dataset(
                engine, secret=settings.anonymization_secret
            )
        except Exception as error:
            raise RealEvidenceExecutionError(
                "Read-only body-weight extraction failed"
            ) from error
    finally:
        engine.dispose()
    return evaluate_evidence_frame(frame, data_origin="REAL", protocol=frozen)


def run_synthetic_protocol_validation(
    config: DataScienceConfig | None = None,
    protocol: FrozenWeightEvidenceProtocol | None = None,
) -> RealEvidenceResult:
    """Exercise protocol mechanics without representing results as real evidence."""
    settings = config or DataScienceConfig.from_env()
    frame = generate_synthetic_datasets(settings.synthetic_seed).body_weight
    return evaluate_evidence_frame(
        frame,
        data_origin="SYNTHETIC",
        protocol=protocol or FrozenWeightEvidenceProtocol(),
    )


def _write_report(result: RealEvidenceResult, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(render_real_evidence_report(result), encoding="utf-8")


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run the frozen Body Weight real-data evidence protocol."
    )
    parser.add_argument(
        "--synthetic-validation",
        action="store_true",
        help="Validate mechanics using only deterministic synthetic in-memory data.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional ignored Markdown report path.",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    settings = DataScienceConfig.from_env()
    try:
        result = (
            run_synthetic_protocol_validation(settings)
            if args.synthetic_validation
            else run_real_evidence(settings)
        )
    except RealEvidenceExecutionError as error:
        print(json.dumps({"status": "ERROR", "message": str(error)}))
        return 1
    default_name = (
        "body_weight_synthetic_protocol_validation.md"
        if args.synthetic_validation
        else "body_weight_real_evidence_v1.md"
    )
    output_path = args.output or settings.artifact_dir / default_name
    _write_report(result, output_path)
    print(json.dumps(result.aggregate_summary.to_dict(), sort_keys=True))
    return 2 if result.data_origin == "UNAVAILABLE" else 0


if __name__ == "__main__":
    raise SystemExit(main())
