"""Fixed evaluation-only sensitivity comparisons; defaults are never mutated."""

from __future__ import annotations

from dataclasses import replace

import pandas as pd

from metaform_ds.modeling.weight.backtesting import expanding_window_backtest
from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.metrics import metric_comparison
from metaform_ds.modeling.weight.targets import build_weight_prediction_examples


def sensitivity_analysis(
    frame: pd.DataFrame, config: WeightModelConfig
) -> pd.DataFrame:
    columns = [
        "minimum_prior_measurements",
        "target_tolerance_days",
        "eligible_examples",
        "evaluated_predictions",
        "mean_target_offset_days",
        "model",
        "mae_kg",
    ]
    rows: list[dict[str, object]] = []
    for minimum_history in config.sensitivity_history_values:
        for tolerance in config.sensitivity_tolerance_values:
            candidate = replace(
                config,
                minimum_prior_measurements=minimum_history,
                target_tolerance_days=tolerance,
            )
            targets = build_weight_prediction_examples(frame, candidate)
            backtest = expanding_window_backtest(targets.examples, candidate)
            comparison = metric_comparison(backtest.predictions)
            if comparison.empty:
                rows.append(
                    {
                        "minimum_prior_measurements": minimum_history,
                        "target_tolerance_days": tolerance,
                        "eligible_examples": len(targets.examples),
                        "evaluated_predictions": 0,
                        "mean_target_offset_days": float(
                            targets.examples["target_offset_days"].mean()
                        )
                        if len(targets.examples)
                        else None,
                        "model": None,
                        "mae_kg": None,
                    }
                )
                continue
            for metric in comparison.itertuples(index=False):
                rows.append(
                    {
                        "minimum_prior_measurements": minimum_history,
                        "target_tolerance_days": tolerance,
                        "eligible_examples": len(targets.examples),
                        "evaluated_predictions": metric.prediction_count,
                        "mean_target_offset_days": float(
                            targets.examples["target_offset_days"].mean()
                        ),
                        "model": metric.model,
                        "mae_kg": metric.mae_kg,
                    }
                )
    return pd.DataFrame(rows, columns=columns)
