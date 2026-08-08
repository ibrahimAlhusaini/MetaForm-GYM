"""Aggregate-only real strength evidence reporting."""

from __future__ import annotations

from dataclasses import asdict

import pandas as pd

from metaform_ds.modeling.strength.evidence import StrengthEvidenceResult


def _table(frame: pd.DataFrame) -> str:
    if frame.empty:
        return "Insufficient data."
    columns = [str(column) for column in frame.columns]
    header = "| " + " | ".join(columns) + " |"
    divider = "|" + "|".join("---" for _ in columns) + "|"
    rows = []
    for values in frame.itertuples(index=False, name=None):
        cells = [str(value).replace("|", "\\|") for value in values]
        rows.append("| " + " | ".join(cells) + " |")
    return "\n".join([header, divider, *rows])


def _facts(values: dict[str, object]) -> str:
    return "\n".join(f"- {key}: {value}" for key, value in values.items())


def render_strength_real_evidence_report(result: StrengthEvidenceResult) -> str:
    evaluation = result.evaluation
    comparison = pd.DataFrame() if evaluation is None else evaluation.comparison
    stability = pd.DataFrame() if evaluation is None else evaluation.stability
    source = pd.DataFrame() if evaluation is None else evaluation.source_type_metrics
    history = pd.DataFrame() if evaluation is None else evaluation.history_metrics
    cadence = pd.DataFrame() if evaluation is None else evaluation.cadence_metrics
    sections = [
        "# Real Strength Evidence Protocol V1",
        "",
        f"- Data origin: {result.data_origin}",
        f"- Execution date: {result.executed_at}",
        f"- Protocol version: {result.protocol.protocol_version}",
        f"- Protocol hash: {result.protocol.protocol_hash}",
        f"- Evidence state: {result.evidence_state}",
        f"- Evidence scope: {result.evidence_scope}",
        (
            "- Preferred method: "
            f"{result.aggregate_summary.preferred_method or 'Not evaluated'}"
        ),
        f"- Integration review allowed: {result.integration_review_allowed}",
        "",
        "## Frozen protocol",
        "",
        "The target, features, baselines, models, thresholds, and selection rules "
        "were frozen before real strength performance was viewed.",
        "",
        "```json",
        result.protocol.canonical_json(),
        "```",
        "",
        "## Aggregate data quality",
        "",
        _facts(asdict(result.quality)),
        "",
        "## Aggregate eligibility and source coverage",
        "",
        _facts(asdict(result.eligibility)),
        "",
        "## Frozen four-method comparison",
        "",
        _table(comparison),
        "",
        "## Temporal stability",
        "",
        _table(stability),
        "",
        "## Source-type segments",
        "",
        _table(source),
        "",
        "## History segments",
        "",
        _table(history),
        "",
        "## Cadence segments",
        "",
        _table(cadence),
        "",
        "## Directional analysis",
        "",
        (
            "Direction accuracy is descriptive in the comparison table; MAE remains "
            "the primary metric."
        ),
        "",
        "## Integration-review gate",
        "",
        f"- Allowed: {result.integration_review_allowed}",
        f"- Reason codes: {', '.join(result.reason_codes) or 'NONE'}",
        "",
        "## Limitations and next decision gate",
        "",
        *(
            [f"- {limitation}" for limitation in result.limitations]
            or ["- No additional limitations recorded."]
        ),
        "- This protocol never emits PRODUCTION_READY.",
        (
            "- No row-level predictions, model artifacts, or application changes "
            "are produced."
        ),
        "- Product integration review is a separate future decision.",
    ]
    return "\n".join(sections) + "\n"
