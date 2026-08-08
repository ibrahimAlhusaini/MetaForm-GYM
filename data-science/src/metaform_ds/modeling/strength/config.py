"""Centralized Strength Progression Modeling V1 configuration."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class StrengthModelConfig:
    model_version: str = "strength-next-session-v1"
    minimum_prior_sessions: int = 4
    recent_window: int = 3
    trend_window: int = 4
    minimum_training_rows: int = 12
    minimum_sources: int = 2
    minimum_temporal_folds: int = 3
    ridge_alpha: float = 1.0
    meaningful_improvement_percent: float = 5.0
    minimum_selection_predictions: int = 12
    maximum_fold_mae_cv: float = 1.0
    direction_tolerance_kg: float = 0.5
    cadence_frequent_max_days: float = 7.0
    cadence_moderate_max_days: float = 14.0
    minimum_segment_predictions: int = 3

    def __post_init__(self) -> None:
        positive = (
            self.minimum_prior_sessions,
            self.recent_window,
            self.trend_window,
            self.minimum_training_rows,
            self.minimum_sources,
            self.minimum_temporal_folds,
            self.ridge_alpha,
            self.minimum_selection_predictions,
            self.cadence_frequent_max_days,
            self.cadence_moderate_max_days,
            self.minimum_segment_predictions,
        )
        if any(value <= 0 for value in positive):
            raise ValueError("Strength model configuration values must be positive")
        if self.meaningful_improvement_percent < 0:
            raise ValueError("Improvement threshold cannot be negative")
        if self.maximum_fold_mae_cv < 0 or self.direction_tolerance_kg < 0:
            raise ValueError("Stability and direction tolerances cannot be negative")
        if self.cadence_frequent_max_days >= self.cadence_moderate_max_days:
            raise ValueError("Cadence thresholds must increase")
        if not self.model_version.strip():
            raise ValueError("model_version cannot be blank")
