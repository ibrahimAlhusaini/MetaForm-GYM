"""Body-weight Prediction V1 public API."""

from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.evaluation import (
    WeightEvaluationResult,
    evaluate_weight_model,
)
from metaform_ds.modeling.weight.reports import render_weight_evaluation_report
from metaform_ds.modeling.weight.targets import (
    WeightTargetResult,
    build_weight_prediction_examples,
)

__all__ = [
    "WeightEvaluationResult",
    "WeightModelConfig",
    "WeightTargetResult",
    "build_weight_prediction_examples",
    "evaluate_weight_model",
    "render_weight_evaluation_report",
]
