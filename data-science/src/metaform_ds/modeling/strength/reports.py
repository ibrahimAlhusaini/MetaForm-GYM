"""Aggregate-only Strength Progression V1 report rendering."""

from __future__ import annotations

import math

import pandas as pd

from metaform_ds.modeling.strength.evaluation import StrengthEvaluationResult


def _number(value: object, suffix: str = "") -> str:
    try:
        number = float(str(value))
    except (TypeError, ValueError):
        return "Not available"
    return f"{number:.3f}{suffix}" if math.isfinite(number) else "Not available"


def render_strength_evaluation_report(result: StrengthEvaluationResult) -> str:
    summary = result.eligibility_summary.iloc[0]
    machine_candidates = result.comparison.loc[
        result.comparison["method"].isin(["Linear Regression", "Ridge Regression"])
    ]
    best_machine = (
        str(machine_candidates.sort_values("mae_kg", kind="stable").iloc[0]["method"])
        if not machine_candidates.empty
        else "Not available"
    )
    best_machine_detail = result.selection_details.loc[
        result.selection_details.get("method", pd.Series(dtype="object")).eq(
            best_machine
        )
    ]
    improvement = (
        best_machine_detail.iloc[0]["improvement_vs_best_baseline_percent"]
        if not best_machine_detail.empty
        else None
    )
    lines = [
        f"# Strength Progression V1 Evaluation — {result.data_origin}",
        "",
        f"- Status: {result.status}",
        f"- Data origin: {result.data_origin}",
        f"- Model version: {result.config.model_version}",
        (
            "- Target: representative maximum working weight in the next "
            "strictly later completed same-source session"
        ),
        f"- Minimum prior source sessions: {result.config.minimum_prior_sessions}",
        f"- Eligible examples: {int(summary['eligible_examples'])}",
        f"- Eligible sources: {int(summary['eligible_sources'])}",
        f"- Evaluated predictions: {len(result.predictions)}",
        "",
        "## Aggregate metrics",
        "",
        "| Method | MAE | RMSE | R² | Predictions | Direction accuracy |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    if result.comparison.empty:
        lines.append("| Insufficient data | — | — | — | 0 | — |")
    else:
        for row in result.comparison.itertuples(index=False):
            lines.append(
                f"| {row.method} | {_number(row.mae_kg, ' kg')} | "
                f"{_number(row.rmse_kg, ' kg')} | {_number(row.r2)} | "
                f"{row.prediction_count} | {_number(row.direction_accuracy)} |"
            )
    lines.extend(
        [
            "",
            "## Model selection",
            "",
            f"- Best baseline: {result.best_baseline or 'Not available'}",
            f"- Best ML candidate: {best_machine}",
            (
                "- Best ML MAE improvement versus best baseline: "
                f"{_number(improvement, '%')}"
            ),
            f"- Preferred method: {result.preferred_method or 'Not available'}",
            f"- Recommendation: {result.recommendation}",
            "",
            "## Temporal stability and segments",
            "",
            "| Method | Folds | Mean fold MAE | Fold MAE CV |",
            "|---|---:|---:|---:|",
        ]
    )
    for row in result.stability.itertuples(index=False):
        lines.append(
            f"| {row.method} | {row.fold_count} | "
            f"{_number(row.fold_mae_mean, ' kg')} | {_number(row.fold_mae_cv)} |"
        )
    for title, frame, segment in (
        ("Source type", result.source_type_metrics, "source_type"),
        ("History length", result.history_metrics, "history_bucket"),
        ("Cadence", result.cadence_metrics, "cadence_bucket"),
    ):
        lines.extend(
            [
                "",
                f"### {title}",
                "",
                "| Segment | Method | MAE | Predictions | Sufficient |",
                "|---|---|---:|---:|---|",
            ]
        )
        for row in frame.itertuples(index=False):
            lines.append(
                f"| {getattr(row, segment)} | {row.method} | "
                f"{_number(row.mae_kg, ' kg')} | {row.prediction_count} | "
                f"{row.sufficient} |"
            )
    lines.extend(
        [
            "",
            ("Sparse groups are marked insufficient and must not be overinterpreted."),
            "",
            "## Exclusions",
            "",
        ]
    )
    for row in result.exclusion_reasons.itertuples(index=False):
        lines.append(f"- {row.reason}: {row.count}")
    lines.extend(
        [
            "",
            "## Limitations",
            "",
            (
                "- Synthetic evaluation validates mechanics only and is not "
                "real-world evidence."
            ),
            (
                "- Irregular histories and deloads can increase error; predictions "
                "are never forced upward."
            ),
            (
                "- Predictions are clamped only at the physical lower bound of "
                "zero kilograms."
            ),
            (
                "- No raw user/source UUIDs or custom-machine names appear in "
                "model features or this report."
            ),
            "- No model is persisted or served.",
            "",
            "## Integration recommendation",
            "",
            (
                "Do not integrate into the product until representative real "
                "read-only evaluation satisfies the selection gate and receives "
                "explicit review."
            ),
        ]
    )
    return "\n".join(lines) + "\n"
