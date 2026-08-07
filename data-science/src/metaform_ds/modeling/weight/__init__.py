"""Body-weight Prediction V1 public API."""

from metaform_ds.modeling.weight.config import WeightModelConfig
from metaform_ds.modeling.weight.evaluation import (
    WeightEvaluationResult,
    evaluate_weight_model,
)
from metaform_ds.modeling.weight.reports import render_weight_evaluation_report
from metaform_ds.modeling.weight.robustness import (
    WeightRobustnessResult,
    evaluate_weight_robustness,
)
from metaform_ds.modeling.weight.robustness_reports import render_robustness_report
from metaform_ds.modeling.weight.targets import (
    WeightTargetResult,
    build_weight_prediction_examples,
)

__all__ = [
    "WeightEvaluationResult",
    "WeightModelConfig",
    "WeightRobustnessResult",
    "WeightTargetResult",
    "build_weight_prediction_examples",
    "evaluate_weight_model",
    "evaluate_weight_robustness",
    "render_robustness_report",
    "render_weight_evaluation_report",
]
