"""Aggregate-only Markdown report for robustness and calibration."""

from __future__ import annotations

from metaform_ds.modeling.weight.robustness import WeightRobustnessResult


def _table(frame: object) -> str:
    import pandas as pd

    if not isinstance(frame, pd.DataFrame) or frame.empty:
        return "Insufficient data."
    headers = [str(column) for column in frame.columns]
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in frame.itertuples(index=False, name=None):
        lines.append("| " + " | ".join(str(value) for value in row) + " |")
    return "\n".join(lines)


def render_robustness_report(result: WeightRobustnessResult) -> str:
    """Render aggregate diagnostics without prediction rows or user identifiers."""
    config = result.config
    reliability = result.reliability_metadata
    point_abstentions = (
        int((~reliability["point_eligible"]).sum()) if len(reliability) else 0
    )
    missing_intervals = (
        int((~reliability["interval_available"]).sum()) if len(reliability) else 0
    )
    sections = [
        "# Body Weight Model Robustness and Calibration",
        "",
        f"- Data origin: {result.data_origin}",
        f"- Model version: {config.model_version}",
        f"- Forecast horizon: {config.forecast_horizon_days} days",
        f"- Prediction count: {len(result.predictions)}",
        f"- Preferred method: {result.preferred_method}",
        f"- Production recommendation state: {result.recommendation_state}",
        "",
        "## Aggregate metrics",
        "",
        _table(result.comparison),
        "",
        "## Temporal stability",
        "",
        _table(result.stability),
        "",
        "## Temporal periods",
        "",
        _table(result.temporal_periods),
        "",
        "## Calendar cutoffs",
        "",
        _table(result.calendar_cutoffs),
        "",
        "## Cadence results",
        "",
        _table(result.cadence_metrics),
        "",
        "## History-length results",
        "",
        _table(result.history_metrics),
        "",
        "## Empirical interval diagnostics",
        "",
        _table(result.interval_diagnostics),
        "",
        "## Abstention summary",
        "",
        f"- Point abstentions: {point_abstentions}",
        f"- Missing empirical intervals: {missing_intervals}",
        "",
        "## Sensitivity analysis",
        "",
        _table(result.sensitivity),
        "",
        "## Limitations",
        "",
        "- Synthetic results validate mechanics only and are not real-world evidence.",
        "- Empirical intervals are not guaranteed confidence intervals.",
        "- Tiny folds and segments can be unstable and are explicitly flagged.",
        "- Large errors remain in all headline metrics.",
        "- No model is persisted or integrated into the application.",
    ]
    return "\n".join(sections) + "\n"
