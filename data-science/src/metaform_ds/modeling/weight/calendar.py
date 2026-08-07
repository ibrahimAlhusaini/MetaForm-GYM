"""Explicit historical-cutoff evaluation without random resampling."""

from __future__ import annotations

from collections.abc import Sequence

import pandas as pd

from metaform_ds.modeling.weight.backtesting import expanding_window_backtest
from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.metrics import metric_comparison
from metaform_ds.modeling.weight.targets import build_weight_prediction_examples


def calendar_cutoff_evaluation(
    frame: pd.DataFrame,
    cutoffs: Sequence[pd.Timestamp],
    config: WeightModelConfig,
) -> pd.DataFrame:
    columns = [
        "cutoff_date",
        "status",
        "model",
        "mae_kg",
        "rmse_kg",
        "r2",
        "prediction_count",
    ]
    examples = build_weight_prediction_examples(frame, config).examples
    backtest = expanding_window_backtest(examples, config)
    rows: list[dict[str, object]] = []
    for raw_cutoff in cutoffs:
        cutoff = pd.Timestamp(raw_cutoff)
        if cutoff.tzinfo is None:
            cutoff = cutoff.tz_localize("UTC")
        else:
            cutoff = cutoff.tz_convert("UTC")
        post_cutoff = backtest.predictions.loc[
            backtest.predictions["prediction_date"].ge(cutoff)
        ]
        comparison = metric_comparison(post_cutoff)
        if comparison.empty:
            rows.append(
                {
                    "cutoff_date": cutoff,
                    "status": "INSUFFICIENT_DATA",
                    "model": None,
                    "mae_kg": None,
                    "rmse_kg": None,
                    "r2": None,
                    "prediction_count": 0,
                }
            )
            continue
        for metric in comparison.itertuples(index=False):
            rows.append(
                {
                    "cutoff_date": cutoff,
                    "status": "COMPLETE",
                    "model": metric.model,
                    "mae_kg": metric.mae_kg,
                    "rmse_kg": metric.rmse_kg,
                    "r2": metric.r2,
                    "prediction_count": metric.prediction_count,
                }
            )
    return pd.DataFrame(rows, columns=columns)
