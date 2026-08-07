"""Centralized Body-weight Prediction V1 configuration."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class WeightModelConfig:
    """Validated constants defining the complete V1 experiment contract."""

    forecast_horizon_days: int = 7
    target_tolerance_days: int = 2
    minimum_prior_measurements: int = 5
    rolling_short_window: int = 3
    rolling_long_window: int = 5
    measurement_frequency_days: int = 30
    trend_window: int = 5
    minimum_training_rows: int = 8
    meaningful_improvement_percent: float = 5.0
    ridge_alpha: float = 1.0
    interval_coverage: float = 0.80
    minimum_interval_residuals: int = 5
    cadence_high_max_days: float = 4.0
    cadence_moderate_max_days: float = 7.0
    maximum_recent_gap_days: float = 14.0
    history_medium_minimum: int = 8
    history_long_minimum: int = 12
    minimum_segment_predictions: int = 3
    minimum_selection_predictions: int = 10
    maximum_fold_mae_cv: float = 1.0
    large_error_threshold_kg: float = 1.0
    sensitivity_history_values: tuple[int, ...] = (5, 7, 10)
    sensitivity_tolerance_values: tuple[int, ...] = (1, 2)
    random_seed: int = 20_260_807
    model_version: str = "body-weight-v1"

    def __post_init__(self) -> None:
        positive_values = {
            "forecast_horizon_days": self.forecast_horizon_days,
            "minimum_prior_measurements": self.minimum_prior_measurements,
            "rolling_short_window": self.rolling_short_window,
            "rolling_long_window": self.rolling_long_window,
            "measurement_frequency_days": self.measurement_frequency_days,
            "trend_window": self.trend_window,
            "minimum_training_rows": self.minimum_training_rows,
            "minimum_interval_residuals": self.minimum_interval_residuals,
            "history_medium_minimum": self.history_medium_minimum,
            "history_long_minimum": self.history_long_minimum,
            "minimum_segment_predictions": self.minimum_segment_predictions,
            "minimum_selection_predictions": self.minimum_selection_predictions,
        }
        invalid = [name for name, value in positive_values.items() if value <= 0]
        if invalid:
            raise ValueError(
                f"Model configuration must be positive: {', '.join(invalid)}"
            )
        if self.target_tolerance_days < 0:
            raise ValueError("target_tolerance_days cannot be negative")
        if self.target_tolerance_days >= self.forecast_horizon_days:
            raise ValueError("target tolerance must be smaller than forecast horizon")
        if self.rolling_short_window > self.rolling_long_window:
            raise ValueError("short rolling window cannot exceed long rolling window")
        if self.meaningful_improvement_percent < 0:
            raise ValueError("meaningful improvement threshold cannot be negative")
        if self.ridge_alpha <= 0:
            raise ValueError("ridge_alpha must be positive")
        if not 0 < self.interval_coverage < 1:
            raise ValueError("interval_coverage must be between zero and one")
        if not (
            0
            < self.cadence_high_max_days
            < self.cadence_moderate_max_days
            < self.maximum_recent_gap_days
        ):
            raise ValueError("cadence and gap thresholds must increase")
        if not self.history_medium_minimum < self.history_long_minimum:
            raise ValueError("history thresholds must increase")
        if self.maximum_fold_mae_cv < 0 or self.large_error_threshold_kg <= 0:
            raise ValueError("stability and error thresholds must be non-negative")
        if not self.sensitivity_history_values or not self.sensitivity_tolerance_values:
            raise ValueError("sensitivity values cannot be empty")
        if not self.model_version.strip():
            raise ValueError("model_version cannot be blank")

    @property
    def target_minimum_days(self) -> int:
        return self.forecast_horizon_days - self.target_tolerance_days

    @property
    def target_maximum_days(self) -> int:
        return self.forecast_horizon_days + self.target_tolerance_days
