"""Aggregate-only Markdown evaluation report rendering."""

from __future__ import annotations

import math

from metaform_ds.modeling.weight.evaluation import WeightEvaluationResult


def _metric(value: object, unit: str = "") -> str:
    if value is None:
        return "Not available"
    try:
        numeric = float(str(value))
    except (TypeError, ValueError):
        return "Not available"
    if not math.isfinite(numeric):
        return "Not available"
    return f"{numeric:.3f}{unit}"


def render_weight_evaluation_report(result: WeightEvaluationResult) -> str:
    """Render safe aggregate metrics without prediction rows or user identifiers."""
    config = result.config
    summary = result.eligibility_summary.iloc[0]
    lines = [
        f"# Body Weight Prediction V1 Evaluation — {result.data_origin}",
        "",
        f"- Status: {result.status}",
        f"- Model version: {config.model_version}",
        f"- Data origin: {result.data_origin}",
        f"- Forecast horizon: {config.forecast_horizon_days} days",
        (
            f"- Target tolerance: ±{config.target_tolerance_days} days "
            f"({config.target_minimum_days}–{config.target_maximum_days} days)"
        ),
        (
            f"- Eligibility: at least {config.minimum_prior_measurements} "
            "prior measurements"
        ),
        f"- Input rows: {int(summary['input_rows'])}",
        f"- Eligible examples: {int(summary['eligible_examples'])}",
        f"- Eligible users: {int(summary['eligible_users'])}",
        f"- Evaluated predictions: {len(result.predictions)}",
        "",
        "## Model and baseline comparison",
        "",
        "| Model | MAE | RMSE | R² | Predictions |",
        "|---|---:|---:|---:|---:|",
    ]
    if result.comparison.empty:
        lines.append("| No comparable metrics | — | — | — | 0 |")
    else:
        for row in result.comparison.itertuples(index=False):
            lines.append(
                f"| {row.model} | {_metric(row.mae_kg, ' kg')} | "
                f"{_metric(row.rmse_kg, ' kg')} | {_metric(row.r2)} | "
                f"{row.prediction_count} |"
            )
    lines.extend(
        [
            "",
            "## Baseline comparison",
            "",
            (
                "Linear Regression improvement versus the best baseline: "
                f"{_metric(result.improvement_vs_best_baseline_percent, '%')}"
            ),
            "",
            result.interpretation,
            "",
            "## Exclusions and limitations",
            "",
        ]
    )
    for row in result.exclusion_reasons.itertuples(index=False):
        lines.append(f"- {row.reason}: {row.count}")
    lines.extend(
        [
            "- Targets are observed measurements; no labels are interpolated.",
            "- Observational measurement noise and irregular cadence remain.",
            "- R² is omitted for fewer than two or constant actual observations.",
            "- Synthetic accuracy is pipeline validation, never real-world evidence.",
            "- No production integration or persisted model is produced.",
            "",
            "## Production recommendation",
            "",
            (
                "Do not integrate automatically. Require meaningful baseline gains on "
                "representative real histories, stable temporal validation, "
                "error review, "
                "and explicit product/privacy approval first."
            ),
        ]
    )
    return "\n".join(lines) + "\n"
