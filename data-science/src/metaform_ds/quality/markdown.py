"""Safe Markdown rendering for reusable quality reports."""

from __future__ import annotations

from metaform_ds.quality.report import QualityReport


def quality_report_markdown(report: QualityReport) -> str:
    """Render aggregate findings only; no row-level user data is included."""
    lines = [
        f"# Data quality: {report.dataset_name}",
        "",
        f"- Rows: {report.row_count}",
        f"- Columns: {report.column_count}",
        f"- Total issue instances: {report.issue_count}",
        "",
        "## Null rates",
        "",
        "| Column | Null count | Null rate |",
        "|---|---:|---:|",
    ]
    for row in report.null_rates.itertuples(index=False):
        lines.append(f"| {row.column} | {row.null_count} | {row.null_rate:.2%} |")
    lines.extend(["", "## Findings", ""])
    if report.issues.empty:
        lines.append("No configured issues detected.")
    else:
        lines.extend(["| Code | Severity | Count | Detail |", "|---|---|---:|---|"])
        for row in report.issues.itertuples(index=False):
            lines.append(
                f"| {row.code} | {row.severity} | {row.count} | {row.detail} |"
            )
    return "\n".join(lines) + "\n"
