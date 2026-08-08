"""Privacy-safe aggregate Markdown reporting for real-data evidence."""

from __future__ import annotations

from dataclasses import asdict

import pandas as pd

from metaform_ds.modeling.weight.evidence import RealEvidenceResult


def _table(frame: pd.DataFrame) -> str:
    if frame.empty:
        return "Insufficient data."
    headers = [str(column) for column in frame.columns]
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in frame.itertuples(index=False, name=None):
        lines.append("| " + " | ".join(str(value) for value in row) + " |")
    return "\n".join(lines)


def _facts(values: dict[str, object]) -> str:
    return "\n".join(
        f"- {name.replace('_', ' ').capitalize()}: {value}"
        for name, value in values.items()
    )


def render_real_evidence_report(result: RealEvidenceResult) -> str:
    """Render aggregates only; prediction rows and all user identifiers stay absent."""
    robustness = result.robustness
    comparison = pd.DataFrame() if robustness is None else robustness.comparison
    stability = pd.DataFrame() if robustness is None else robustness.stability
    cadence = pd.DataFrame() if robustness is None else robustness.cadence_metrics
    history = pd.DataFrame() if robustness is None else robustness.history_metrics
    intervals = (
        pd.DataFrame() if robustness is None else robustness.interval_diagnostics
    )
    reliability = (
        pd.DataFrame() if robustness is None else robustness.reliability_metadata
    )
    point_abstentions = (
        int((~reliability["point_eligible"]).sum()) if len(reliability) else 0
    )
    missing_intervals = (
        int((~reliability["interval_available"]).sum()) if len(reliability) else 0
    )
    preferred = None if robustness is None else robustness.preferred_method
    sections = [
        "# Body Weight Real-data Evidence Protocol V1",
        "",
        f"- Data origin: {result.data_origin}",
        f"- Execution date: {result.executed_at}",
        f"- Protocol version: {result.protocol.protocol_version}",
        f"- Protocol hash: {result.protocol.protocol_hash}",
        f"- Evidence state: {result.evidence_state}",
        f"- Evidence scope: {result.evidence_scope}",
        f"- Preferred method: {preferred or 'Not evaluated'}",
        f"- Integration review allowed: {result.integration_review_allowed}",
        "",
        "## Frozen protocol",
        "",
        "The protocol and thresholds were fixed before real performance was viewed. "
        "Sensitivity results are descriptive and cannot change these defaults.",
        "",
        "```json",
        result.protocol.canonical_json(),
        "```",
        "",
        "## Aggregate data quality",
        "",
        _facts(asdict(result.quality)),
        "",
        "## Aggregate eligibility",
        "",
        _facts(asdict(result.eligibility)),
        "",
        "## Model comparison",
        "",
        _table(comparison),
        "",
        "## Temporal stability",
        "",
        _table(stability),
        "",
        "## Cadence coverage",
        "",
        _table(cadence),
        "",
        "## History coverage",
        "",
        _table(history),
        "",
        "## Empirical interval diagnostics",
        "",
        _table(intervals),
        "",
        "## Abstention summary",
        "",
        f"- Point abstentions: {point_abstentions}",
        f"- Missing empirical intervals: {missing_intervals}",
        "",
        "## Integration-review gate",
        "",
        f"- Allowed: {result.integration_review_allowed}",
        f"- Reason codes: {', '.join(result.reason_codes) or 'NONE'}",
        "",
        "## Limitations",
        "",
        *(
            [f"- {limitation}" for limitation in result.limitations]
            or ["- No additional limitations recorded."]
        ),
        "- This stage never emits PRODUCTION_READY.",
        "- No model artifact is persisted or integrated with the application.",
    ]
    return "\n".join(sections) + "\n"
